export namespace Arrays {
  export function clear<T>(array: T[]) {
    while (array.pop());
  }

  export function last<T>(array: T[]) {
    if (array.length === 0) return null;
    return array[array.length - 1];
  }
}
