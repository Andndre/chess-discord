import { Strings } from "$lib/chess-engine/utils";

export interface BasicPiece {
  type: PieceType;
  color: PieceColor;
}

export interface Piece extends BasicPiece {
  offset: number;
  moved: number;
}

export enum PieceColor {
  NONE,
  WHITE,
  BLACK,
}

// export enum PieceScore {
//   NONE,
//   PAWN = 1,
//   KNIGHT = 3,
//   BISHOP = 3,
//   ROOK = 5,
//   QUEEN = 9,
//   KING = Infinity,
// }

export enum PieceType {
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
  NONE,
}

export namespace Pieces {
  export function fromChar(char: string): BasicPiece {
    const color = Strings.isUpperCase(char)
      ? PieceColor.WHITE
      : PieceColor.BLACK;
    switch (char.toLowerCase()) {
      case "r":
        return { color, type: PieceType.ROOK };
      case "b":
        return { color, type: PieceType.BISHOP };
      case "k":
        return { color, type: PieceType.KING };
      case "n":
        return { color, type: PieceType.KNIGHT };
      case "p":
        return { color, type: PieceType.PAWN };
      case "q":
        return { color, type: PieceType.QUEEN };
      default:
        return { color: PieceColor.NONE, type: PieceType.NONE };
    }
  }

  export function invertColor(color: PieceColor) {
    switch (color) {
      case PieceColor.BLACK:
        return PieceColor.WHITE;
      case PieceColor.WHITE:
        return PieceColor.BLACK;
    }
    return PieceColor.NONE;
  }
}
