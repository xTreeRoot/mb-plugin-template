import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { home, search, stream } from '../index.js';

test('search advances by returned rows and does not repeat or stall', () => {
  const first = search({ query: ' 试听 ', kind: 'tracks', offset: 0 });
  const second = search({ query: '试听', kind: 'tracks', offset: first.tracks.length });
  assert.equal(first.more, true);
  assert.equal(second.more, false);
  assert.equal(second.tracks.length, 1);
  assert.notEqual(first.tracks[0].id, second.tracks[0].id);
  assert.deepEqual(search({ query: '不存在', kind: 'tracks', offset: 0 }), { tracks: [], more: false });
  assert.deepEqual(search({ query: '试听', kind: 'albums', offset: 0 }), { tracks: [], more: false });
  assert.throws(() => search({ query: '试听', offset: -1 }), /偏移/);
});

test('home and search use the same IDs, and each ID resolves to playable media', async () => {
  const manifest = JSON.parse(await readFile(new URL('../plugin.json', import.meta.url), 'utf8'));
  const tracks = home().sections.flatMap((section) => section.tracks);
  assert.ok(tracks.length > 0);
  for (const track of tracks) {
    assert.deepEqual(search({ query: track.name }).tracks, [track]);
    const media = stream({ id: track.id, quality: 'standard' });
    const url = new URL(media.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(manifest.permissions.network.includes(url.hostname));
    assert.equal(media.type, 'wav');
    const audio = await readFile(new URL(`../demo/${url.pathname.split('/').pop()}`, import.meta.url));
    assert.equal(audio.toString('ascii', 0, 4), 'RIFF');
    assert.equal(audio.toString('ascii', 8, 12), 'WAVE');
    assert.equal(audio.toString('ascii', 36, 40), 'data');
    assert.equal(audio.readUInt32LE(40) * 1000 / audio.readUInt32LE(28), track.duration);
  }
  assert.throws(() => stream({ id: 'unknown' }), /不存在/);
});
