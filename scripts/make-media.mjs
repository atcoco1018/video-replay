/**
 * Builds the stand-in media for every mock debate: one audio recording per debater and one profile
 * image each, written to public/media.
 *
 * Each recording runs the whole debate, as both debaters are recorded at once. A debater speaks
 * only on their own turns, and says the debate's position every 5 seconds ("Ada, 35"), so you can
 * hear where a seek or a resume landed. macOS only: it uses `say` and `afconvert`.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public/media');
const tmp = join(root, 'scripts/.tmp');
const debates = JSON.parse(readFileSync(join(root, 'core/debates/mock-debates.json'), 'utf8'));

const RATE = 22050;
const MARK_EVERY_SECONDS = 5;

mkdirSync(out, { recursive: true });
mkdirSync(tmp, { recursive: true });

/** Mono 16-bit samples of `say` speaking `text`. */
function speak(text, voice) {
  const file = join(tmp, 'phrase.wav');
  execFileSync('say', ['-v', voice, '-o', file, '--file-format=WAVE', `--data-format=LEI16@${RATE}`, text]);
  const wav = readFileSync(file);
  // Walk the RIFF chunks to the samples; `say` writes more than the minimal header.
  let offset = 12;
  while (offset < wav.length) {
    const id = wav.toString('ascii', offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    if (id === 'data') {
      const bytes = wav.subarray(offset + 8, offset + 8 + size);
      return new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error(`no audio from say for "${text}"`);
}

function wavFile(samples) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + samples.length * 2, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(samples.length * 2, 40);
  return Buffer.concat([header, Buffer.from(samples.buffer)]);
}

function avatar({ name, color }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="720" viewBox="0 0 640 720">
  <rect width="640" height="720" fill="${color}"/>
  <circle cx="320" cy="290" r="120" fill="#ffffff" fill-opacity="0.85"/>
  <rect x="150" y="440" width="340" height="200" rx="100" fill="#ffffff" fill-opacity="0.85"/>
  <text x="320" y="320" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="110" font-weight="700" fill="${color}">${name[0]}</text>
</svg>
`;
}

for (const debate of debates) {
  const totalSeconds = debate.turnSeconds * debate.turns;
  for (const participant of debate.participants) {
    const samples = new Int16Array(totalSeconds * RATE);
    for (let turn = 0; turn < debate.turns; turn++) {
      // Turns alternate, starting with the debate's first slot.
      const speakingSlot = turn % 2 === 0 ? debate.first_participant_slot : 3 - debate.first_participant_slot;
      if (speakingSlot !== participant.slot) continue;
      const start = turn * debate.turnSeconds;
      for (let second = start; second < start + debate.turnSeconds; second += MARK_EVERY_SECONDS) {
        const text =
          second === start ? `${participant.name}, turn ${turn + 1}, ${second}` : `${participant.name}, ${second}`;
        // Cut short so a phrase never runs into the next mark or the other debater's turn.
        const phrase = speak(text, participant.voice).subarray(0, (MARK_EVERY_SECONDS - 0.5) * RATE);
        samples.set(phrase, second * RATE);
      }
    }
    const name = `${debate.id}-slot${participant.slot}`;
    const wav = join(tmp, `${name}.wav`);
    writeFileSync(wav, wavFile(samples));
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', wav, join(out, `${name}.m4a`)]);
    writeFileSync(join(out, `${name}.svg`), avatar(participant));
    console.log(`wrote ${name} (${totalSeconds}s)`);
  }
}

rmSync(tmp, { recursive: true, force: true });
