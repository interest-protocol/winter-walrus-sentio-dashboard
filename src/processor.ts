import { getPriceBySymbol } from '@sentio/sdk/utils';
import { blizzard_event_wrapper } from './types/sui/winter-walrus.js';
import { SuiContext, SuiNetwork } from '@sentio/sdk/sui';
import { Counter, Gauge } from '@sentio/sdk';

const extractEvent = (t: string) => t.match(/::blizzard_events::([^>]+)>/)?.[1] || null;
const extractSymbol = (t: string) => (t.match(/::([^:]+)$/)?.[1] ?? t);
const downScale = (amount: bigint) => Number(amount) / 1_000_000_000;

const WAL_SYMBOL = 'WAL' as const;

type EventName = 'Mint' | 'MintAfterVotesFinished' | 'BurnLst';
type EventHandler = (evt: blizzard_event_wrapper.BlizzardEventInstance, ctx: SuiContext) => void;

const state = {
  totalMinted: 0,
  totalBurned: 0
};

const metrics = {
  walPrice: Gauge.register('walPrice'),
  tvlUsd: Gauge.register('tvlUsd'),
  tvlWal: Gauge.register('tvlWal'),
  
  mintVolume: Counter.register('mintVolume'),
  burnVolume: Counter.register('burnVolume'),
  
  mintOperations: Counter.register('mintOperations'),
  burnOperations: Counter.register('burnOperations'),
  
  mintByLst: Counter.register('mintByLst'),
  burnByLst: Counter.register('burnByLst')
};

function isValidEventName(name: string): name is EventName {
  return ['Mint', 'MintAfterVotesFinished', 'BurnLst'].includes(name);
}

async function updateTVLMetrics(ctx: SuiContext) {
  const currentPrice = await getPriceBySymbol(WAL_SYMBOL, ctx.timestamp);
  const netWalAmount = state.totalMinted - state.totalBurned;
  
  metrics.tvlWal.record(ctx, netWalAmount);
  
  if (currentPrice) {
    metrics.walPrice.record(ctx, currentPrice);
    metrics.tvlUsd.record(ctx, netWalAmount * currentPrice);
  }
}

function handleMintEvent(evt: blizzard_event_wrapper.BlizzardEventInstance, ctx: SuiContext) {
  const lst = extractSymbol(evt.data_decoded.pos0.lst.name);
  const amount = downScale(BigInt(evt.data_decoded.pos0.wal_value));
  
  state.totalMinted += amount;
  
  metrics.mintVolume.add(ctx, amount);
  metrics.mintOperations.add(ctx, 1);
  metrics.mintByLst.add(ctx, amount, { lst });
}

function handleBurnEvent(evt: blizzard_event_wrapper.BlizzardEventInstance, ctx: SuiContext) {
  const lst = extractSymbol(evt.data_decoded.pos0.lst.name);
  const amount = downScale(BigInt(evt.data_decoded.pos0.wal_value));
  
  state.totalBurned += amount;
  
  metrics.burnVolume.add(ctx, amount);
  metrics.burnOperations.add(ctx, 1);
  metrics.burnByLst.add(ctx, amount, { lst });
}

const eventHandlers: Record<EventName, EventHandler> = {
  Mint: handleMintEvent,
  MintAfterVotesFinished: handleMintEvent,
  BurnLst: handleBurnEvent
};

blizzard_event_wrapper
  .bind({ network: SuiNetwork.MAIN_NET, startCheckpoint: BigInt(127476680) })
  .onEventBlizzardEvent(async (evt, ctx) => {
    const eventName = extractEvent(evt.type);
    if (!eventName || !isValidEventName(eventName)) return;
    
    eventHandlers[eventName](evt, ctx);
    
    await updateTVLMetrics(ctx);
    
    ctx.eventLogger.emit(eventName, {
      id: evt.id.eventSeq,
      txDigest: evt.id.txDigest,
      sender: evt.sender,
      packageId: evt.packageId,
      transactionModule: evt.transactionModule,
      lst: extractSymbol(evt.data_decoded.pos0.lst.name),
      amount: downScale(BigInt(evt.data_decoded.pos0.wal_value))
    });
  })
  .onTransactionBlock(async (_, ctx) => {
    const currentPrice = await getPriceBySymbol(WAL_SYMBOL, ctx.timestamp);
    ctx.eventLogger.emit('newPrice', {
      symbol: WAL_SYMBOL,
      price: currentPrice,
    });
    await updateTVLMetrics(ctx);
  });