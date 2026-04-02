import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";

persistent actor {
  // ─── Types ───────────────────────────────────────────────────────
  type UserId = Text;
  type CardId = Text;
  type Token  = Text;

  type User = {
    username : Text;
    password : Text;
  };

  type Card = {
    id       : CardId;
    owner    : UserId;
    name     : Text;
    last4    : Text;
    network  : Text;
    gradient : Text;
    expiry   : Text;
    balance  : Nat;
  };

  type Tx = {
    cardId    : CardId;
    amount    : Nat;
    timestamp : Int;
    chargedBy : UserId;
  };

  // ─── State ───────────────────────────────────────────────────────
  transient let users    = HashMap.HashMap<UserId, User>(16, Text.equal, Text.hash);
  transient let sessions = HashMap.HashMap<Token, UserId>(16, Text.equal, Text.hash);
  transient let cards    = HashMap.HashMap<CardId, Card>(32, Text.equal, Text.hash);
  transient let txLog    = Buffer.Buffer<Tx>(64);
  transient var nextCard : Nat = 0;
  transient var tokenSeq : Nat = 0;

  // ─── Helpers ──────────────────────────────────────────────────────
  func makeToken(u : UserId) : Token {
    tokenSeq += 1;
    u # "_tok_" # Nat.toText(tokenSeq)
  };

  func whoIs(token : Token) : ?UserId {
    sessions.get(token)
  };

  // ─── Register / Login ─────────────────────────────────────────────
  public func register(username : Text, password : Text) : async { #ok : Token; #err : Text } {
    if (username == "") { return #err "Username required" };
    if (password == "") { return #err "Password required" };
    switch (users.get(username)) {
      case (?_) { #err "Username already taken" };
      case null {
        users.put(username, { username = username; password = password });
        let tok = makeToken(username);
        sessions.put(tok, username);
        #ok tok
      };
    }
  };

  public func login(username : Text, password : Text) : async { #ok : Token; #err : Text } {
    switch (users.get(username)) {
      case null { #err "User not found" };
      case (?u) {
        if (u.password != password) { return #err "Wrong password" };
        let tok = makeToken(username);
        sessions.put(tok, username);
        #ok tok
      };
    }
  };

  // ─── Cards ────────────────────────────────────────────────────────
  public func enrollCard(
    token    : Token,
    name     : Text,
    last4    : Text,
    network  : Text,
    gradient : Text,
    expiry   : Text,
    balance  : Nat
  ) : async { #ok : CardId; #err : Text } {
    switch (whoIs(token)) {
      case null  { #err "Not logged in" };
      case (?uid) {
        // Enforce 1 card per user
        var userCardCount = 0;
        for ((_, c) in cards.entries()) {
          if (c.owner == uid) { userCardCount += 1 };
        };
        if (userCardCount >= 1) { return #err "You already have a card. Only 1 card allowed." };
        nextCard += 1;
        let cid = uid # "_card_" # Nat.toText(nextCard);
        cards.put(cid, {
          id       = cid;
          owner    = uid;
          name     = name;
          last4    = last4;
          network  = network;
          gradient = gradient;
          expiry   = expiry;
          balance  = balance;
        });
        #ok cid
      };
    }
  };

  public query func getMyCards(token : Token) : async [Card] {
    switch (sessions.get(token)) {
      case null  { [] };
      case (?uid) {
        let out = Buffer.Buffer<Card>(8);
        for ((_, c) in cards.entries()) {
          if (c.owner == uid) { out.add(c) };
        };
        Buffer.toArray(out)
      };
    }
  };

  public query func getAllCards() : async [Card] {
    let out = Buffer.Buffer<Card>(32);
    for ((_, c) in cards.entries()) {
      out.add(c);
    };
    Buffer.toArray(out)
  };

  // ─── Charge ───────────────────────────────────────────────────────
  public func chargeCard(
    token  : Token,
    cardId : CardId,
    amount : Nat
  ) : async { #ok : Nat; #err : Text } {
    switch (whoIs(token)) {
      case null  { #err "Not logged in" };
      case (?uid) {
        switch (cards.get(cardId)) {
          case null  { #err "Card not found" };
          case (?c)  {
            if (c.balance < amount) { return #err "Insufficient balance" };
            let newBalance : Nat = c.balance - amount;
            cards.put(cardId, {
              id       = c.id;
              owner    = c.owner;
              name     = c.name;
              last4    = c.last4;
              network  = c.network;
              gradient = c.gradient;
              expiry   = c.expiry;
              balance  = newBalance;
            });
            txLog.add({
              cardId    = cardId;
              amount    = amount;
              timestamp = Time.now();
              chargedBy = uid;
            });
            #ok newBalance
          };
        }
      };
    }
  };

  public query func getTransactions() : async [Tx] {
    Buffer.toArray(txLog)
  };

  // ─── Principal-based Auth (Internet Identity) ──────────
  public func loginWithPrincipal(principal : Text) : async { #ok : Token; #err : Text } {
    if (principal == "") { return #err "Principal required" };
    let uid = "ii_" # principal;
    switch (users.get(uid)) {
      case null {
        users.put(uid, { username = uid; password = "" });
      };
      case (?_) {};
    };
    let tok = makeToken(uid);
    sessions.put(tok, uid);
    #ok tok
  };
};
