import { describe, it, beforeEach, expect } from 'vitest';
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';

describe('ai-assistant', () => {
  let wallet_1: Account;
  let wallet_2: Account;
  
  beforeEach(() => {
    const accounts = Clarinet.load().accounts;
    wallet_1 = accounts.get('wallet_1')!;
    wallet_2 = accounts.get('wallet_2')!;
  });
  
  it('should mint a new knowledge NFT', () => {
    Clarinet.test({
      name: 'Ensure that users can mint new knowledge NFTs',
      async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        const topic = types.utf8('AI Ethics');
        const data = types.utf8('AI systems should be designed with ethical considerations in mind.');
        const uri = types.utf8('https://example.com/ai-ethics');
        
        const block = chain.mineBlock([
          Tx.contractCall('ai-assistant', 'mint-knowledge', [topic, data, uri], wallet_1.address),
        ]);
        
        block.receipts[0].result.expectOk().expectUint(1);
        block.receipts[0].events.expectNonFungibleTokenMintEvent(types.uint(1), wallet_1.address, 'ai-assistant', 'ai-knowledge');
      },
    });
  });
  
  it('should allow token owner to update knowledge data', () => {
    Clarinet.test({
      name: 'Ensure that token owners can update their knowledge data',
      async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get('wallet_1')!;
        
        const topic = types.utf8('AI Ethics');
        const initialData = types.utf8('Initial data about AI ethics.');
        const uri = types.utf8('https://example.com/ai-ethics');
        const updatedData = types.utf8('Updated data about AI ethics and its importance.');
        
        let block = chain.mineBlock([
          Tx.contractCall('ai-assistant', 'mint-knowledge', [topic, initialData, uri], wallet_1.address),
        ]);
        
        const tokenId = block.receipts[0].result.expectOk().expectUint(1);
        
        block = chain.mineBlock([
          Tx.contractCall('ai-assistant', 'update-knowledge', [types.uint(tokenId), updatedData], wallet_1.address),
        ]);
        
        block.receipts[0].result.expectOk().expectBool(true);
        
        const getKnowledgeResult = chain.callReadOnlyFn('ai-assistant', 'get-knowledge', [types.uint(tokenId)], wallet_1.address);
        const knowledgeData = getKnowledgeResult.result.expectSome().expectTuple();
        expect(knowledgeData['data']).toEqual(updatedData);
      },
    });
  });
  
  it('should not allow non-owners to update knowledge data', () => {
    Clarinet.test({
      name: 'Ensure that non-owners cannot update knowledge data',
      async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;
        
        const topic = types.utf8('AI Ethics');
        const initialData = types.utf8('Initial data about AI ethics.');
        const uri = types.utf8('https://example.com/ai-ethics');
        const updatedData = types.utf8('Attempt to update by non-owner.');
        
        let block = chain.mineBlock([
          Tx.contractCall('ai-assistant', 'mint-knowledge', [topic, initialData, uri], wallet_1.address),
        ]);
        
        const tokenId = block.receipts[0].result.expectOk().expectUint(1);
        
        block = chain.mineBlock([
          Tx.contractCall('ai-assistant', 'update-knowledge', [types.uint(tokenId), updatedData], wallet_2.address),
        ]);
        
        block.receipts[0].result.expectErr().expectUint(101); // err-not-token-owner
      },
    });
  });
  
  it('should allow anyone to read knowledge data', () => {
    Clarinet.test({
      name: 'Ensure that anyone can read knowledge data',
      async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;
        
        const topic = types.utf8('AI Ethics');
        const data = types.utf8('AI systems should be designed with ethical considerations in mind.');
        const uri = types.utf8('https://example.com/ai-ethics');
        
        let block = chain.mineBlock([
          Tx.contractCall('ai-assistant', 'mint-knowledge', [topic, data, uri], wallet_1.address),
        ]);
        
        const tokenId = block.receipts[0].result.expectOk().expectUint(1);
        
        // Wallet 1 (owner) reads the data
        let getKnowledgeResult = chain.callReadOnlyFn('ai-assistant', 'get-knowledge', [types.uint(tokenId)], wallet_1.address);
        let knowledgeData = getKnowledgeResult.result.expectSome().expectTuple();
        expect(knowledgeData['topic']).toEqual(topic);
        expect(knowledgeData['data']).toEqual(data);
        
        // Wallet 2 (non-owner) reads the data
        getKnowledgeResult = chain.callReadOnlyFn('ai-assistant', 'get-knowledge', [types.uint(tokenId)], wallet_2.address);
        knowledgeData = getKnowledgeResult.result.expectSome().expectTuple();
        expect(knowledgeData['topic']).toEqual(topic);
        expect(knowledgeData['data']).toEqual(data);
      },
    });
  });
  
  it('should implement SIP009 NFT interface', () => {
    Clarinet.test({
      name: 'Ensure contract implements SIP009 NFT interface',
      async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;
        
        const topic = types.utf8('AI Ethics');
        const data = types.utf8('AI systems should be designed with ethical considerations in mind.');
        const uri = types.utf8('https://example.com/ai-ethics');
        
        let block = chain.mineBlock([
          Tx.contractCall('ai-assistant', 'mint-knowledge', [topic, data, uri], wallet_1.address),
        ]);
        
        const tokenId = block.receipts[0].result.expectOk().expectUint(1);
        
        // Test get-last-token-id
        let result = chain.callReadOnlyFn('ai-assistant', 'get-last-token-id', [], wallet_1.address);
        result.result.expectOk().expectUint(1);
        
        // Test get-token-owner
        result = chain.callReadOnlyFn('ai-assistant', 'get-token-owner', [types.uint(tokenId)], wallet_1.address);
        result.result.expectOk().expectSome().expectPrincipal(wallet_1.address);
        
        // Test get-balance
        result = chain.callReadOnlyFn('ai-assistant', 'get-balance', [types.principal(wallet_1.address)], wallet_1.address);
        result.result.expectOk().expectUint(1);
        
        // Test transfer
        block = chain.mineBlock([
          Tx.contractCall('ai-assistant', 'transfer', [types.uint(tokenId), types.principal(wallet_1.address), types.principal(wallet_2.address)], wallet_1.address),
        ]);
        block.receipts[0].result.expectOk().expectBool(true);
        
        // Verify new owner
        result = chain.callReadOnlyFn('ai-assistant', 'get-token-owner', [types.uint(tokenId)], wallet_1.address);
        result.result.expectOk().expectSome().expectPrincipal(wallet_2.address);
      },
    });
  });
});
