import { blizzard_event_wrapper } from './types/sui/testnet/winter-walrus.js';
import { SuiNetwork } from '@sentio/sdk/sui';

const EVENTS = {
  StakedWal:
    '0x9bcea92f0fe583011e942d3fc50cfd3e54be9652e55fa7221fec77c0d45e7c17::blizzard_events::StakedWalAdded',
};

blizzard_event_wrapper
  .bind({ network: SuiNetwork.TEST_NET, startCheckpoint: 163_129_000n })
  .onEventBlizzardEvent((evt, ctx) => {
    if (evt.type.includes(EVENTS.StakedWal)) {
    }
  });

const x = {
  id: {
    txDigest: '8Cwbu8FgA8BAkjeVEvQXhXD49qbNfksBURjwT1NBGpRD',
    eventSeq: '0',
  },
  packageId:
    '0x2bddde9d73d65a82de0127f6e97f6a511ccef20c976747b94af77d4928e64a4d',
  transactionModule: 'blizzard_protocol',
  sender: '0x0bac5c2a1d0ea71b893dab40bf4454c01e9a5940ceb01f40400f3e1ae3f6a434',
  type: '0x9bcea92f0fe583011e942d3fc50cfd3e54be9652e55fa7221fec77c0d45e7c17::blizzard_event_wrapper::BlizzardEvent<0x9bcea92f0fe583011e942d3fc50cfd3e54be9652e55fa7221fec77c0d45e7c17::blizzard_events::StakedWalAdded>',
  parsedJson: {
    pos0: {
      activation_epoch: 25,
      idx: '3',
      joined: true,
      lst: {
        name: 'b9671a4464279e45aa7a1264fabba1415a657ef24fa062c6a0d60d11bf04ee31::snow::SNOW',
      },
      node_id:
        '0x2eab79988f43bc772f4eb56be964a018b0ec627d1e92ae11985b69272030206e',
      staked_wal:
        '0xfd49ee2554f7edee2401395314378234faed9fbc52c375bd5826b9605c64f68d',
      value: '1000000000',
      wal_epoch: 24,
    },
  },
  bcs: '',
  data_decoded: {
    pos0: {
      node_id:
        '0x2eab79988f43bc772f4eb56be964a018b0ec627d1e92ae11985b69272030206e',
      lst: {
        name: 'b9671a4464279e45aa7a1264fabba1415a657ef24fa062c6a0d60d11bf04ee31::snow::SNOW',
      },
      staked_wal:
        '0xfd49ee2554f7edee2401395314378234faed9fbc52c375bd5826b9605c64f68d',
      activation_epoch: 25,
      value: '1000000000',
      idx: '3',
      wal_epoch: 24,
      joined: true,
    },
  },
  type_arguments: [
    '0x9bcea92f0fe583011e942d3fc50cfd3e54be9652e55fa7221fec77c0d45e7c17::blizzard_events::StakedWalAdded',
  ],
};
