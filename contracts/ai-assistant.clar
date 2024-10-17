;; AI Assistant Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))

;; Data Variables
(define-data-var next-token-id uint u1)

;; NFT Definitions
(define-non-fungible-token ai-knowledge uint)

;; Data Maps
(define-map token-uris {token-id: uint} {uri: (string-utf8 256)})
(define-map token-data {token-id: uint} {topic: (string-utf8 64), data: (string-utf8 1024)})

;; Mint a new AI knowledge NFT
(define-public (mint-knowledge (topic (string-utf8 64)) (data (string-utf8 1024)) (uri (string-utf8 256)))
    (let
        ((token-id (var-get next-token-id)))
        (try! (nft-mint? ai-knowledge token-id tx-sender))
        (map-set token-uris {token-id: token-id} {uri: uri})
        (map-set token-data {token-id: token-id} {topic: topic, data: data})
        (var-set next-token-id (+ token-id u1))
        (ok token-id)))
