/** Код на двери: восемь букв и цифр. В QR может лежать и ссылка, из неё берём хвост. */
const CODE_PATTERN = /[a-zA-Z0-9]{8}/;

/** Код из распознанного QR или null, если это чужой код. */
export function toCode(scanned: string): string | null {
  const trimmed = scanned.trim();
  const fromUrl =
    trimmed
      .split(/[/?=#]/)
      .filter(Boolean)
      .at(-1) ?? trimmed;
  const match = CODE_PATTERN.exec(fromUrl);
  if (!match) {
    return null;
  }
  return match[0];
}
