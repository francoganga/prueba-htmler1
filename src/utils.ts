interface Hash {
  [index: string]: boolean;
}

export function removeDuplicated(lines: string[]) {
  let hash: Hash = {};

  return lines.filter((l) => {
    if (!hash[l]) {
      hash[l] = true;
      return l;
    }
  });
}
