import { type Board, ChessBoards } from "./board";
import type Chess from "./chess";
import { Coords, Direction } from "./coordinates";
import { PieceColor, Pieces, PieceType } from "./piece";

export interface Move {
  from: number;
  to: number;
  captureType: PieceType;
  check?: number;
  // used when `castling`
  resultingMove?: Move;
  // used when `promoting`
  promoteToType?: PieceType;
  // used when `enpassant`
  captureIndex?: number;
}

interface MoveLine {
  dir: { x: number; y: number };
  steps: number;
}

export namespace Moves {
  export function ofPawn(chess: Chess, from: number, asColor?: PieceColor) {
    const moves: Move[] = [];
    /* up if the pawn is white */
    const offset = chess.board[from].color == PieceColor.WHITE
      ? Direction.UP
      : Direction.DOWN;

    const push = (move: Move) => {
      const { y } = Coords.getCoords(move.to);
      const edgeOrdinate = chess.board[from].color === PieceColor.WHITE ? 0 : 7;
      if (y === edgeOrdinate) {
        for (
          const type of [
            PieceType.QUEEN,
            PieceType.ROOK,
            PieceType.BISHOP,
            PieceType.KNIGHT,
          ]
        ) {
          const newMove: Move = { ...move, promoteToType: type };
          moves.push(newMove);
        }
        return;
      }
      moves.push(move);
    };

    const to = from + offset;

    asColor = asColor ? asColor : chess.board[from].color;
    const opponentColor = Pieces.invertColor(asColor);

    const { y } = Coords.getCoords(from);

    /* insert move forward if the square is empty */
    if (chess.board[to].type === PieceType.NONE) {
      push({ from, to, captureType: PieceType.NONE });
      if (
        y === (offset === Direction.DOWN ? 1 : 6) &&
        chess.board[to + offset].type === PieceType.NONE
      ) {
        push({ from, to: to + offset, captureType: PieceType.NONE });
      }
    }

    const enpassantTarget = getEnpassantTargetOffset(chess);

    /* Checking if the index is not on the left side of the chess.board. */
    if (to % 8 != 0) {
      /* Pawn can capture diagonally to the left.*/
      if (chess.board[to - 1].color === opponentColor) {
        push({
          from,
          to: to - 1,
          captureType: chess.board[to - 1].type,
        });
      }
      // enpassant
      if (enpassantTarget) {
        if (from + offset - 1 === enpassantTarget) {
          push(
            {
              from,
              to: from + offset - 1,
              captureIndex: from - 1,
              captureType: chess.board[from - 1].type,
            },
          );
        }
      }
    }

    /*
        Checking if the index is not on the right side of the chess.board.
        Note: 0 mod 8 = 0
        */
    if ((to - 7) % 8 != 0) {
      /* Pawn can capture diagonally to the right.*/
      if (chess.board[to + 1].color === opponentColor) {
        push({
          from,
          to: to + 1,
          captureType: chess.board[to + 1].type,
        });
      }
      // enpassant
      if (enpassantTarget) {
        if (from + offset + 1 === enpassantTarget) {
          push(
            {
              from,
              to: from + offset + 1,
              captureIndex: from + 1,
              captureType: chess.board[from + 1].type,
            },
          );
        }
      }
    }

    return moves;
  }

  function _ofKnight(board: Board, from: number, asColor?: PieceColor) {
    const moves: Move[] = [];
    const { x, y } = Coords.getCoords(from);
    const range = [
      [-2, 2],
      [-1, 1],
    ];

    asColor = asColor ? asColor : board[from].color;

    for (let i = 0; i < 2; i++) {
      for (const xOffset of range[i]) {
        for (const yOffset of range[1 - i]) {
          if (
            x + xOffset < 0 ||
            x + xOffset > 7 ||
            y + yOffset < 0 ||
            y + yOffset > 7
          ) {
            continue;
          }
          const to = Coords.getOffset(x + xOffset, y + yOffset);

          if (board[to].color === asColor) continue;
          moves.push({ from, to, captureType: board[to].type });
        }
      }
    }

    return moves;
  }

  export function ofKnight(chess: Chess, from: number, asColor?: PieceColor) {
    const moves: Move[] = _ofKnight(chess.board, from, asColor);
    return moves;
  }

  function _ofBishop(board: Board, from: number, asColor?: PieceColor) {
    return [
      ...diagonalMove(board as Board, from, asColor),
    ];
  }
  export function ofBishop(chess: Chess, from: number, asColor?: PieceColor) {
    const moves: Move[] = _ofBishop(chess.board, from, asColor);
    return moves;
  }

  function _ofRook(board: Board, from: number, asColor?: PieceColor) {
    return [...alignAxisMove(board, from, asColor)];
  }
  export function ofRook(chess: Chess, from: number, asColor?: PieceColor) {
    const moves: Move[] = _ofRook(chess.board, from, asColor);
    return moves;
  }

  function _ofQueen(board: Board, from: number, asColor?: PieceColor) {
    return [
      ...diagonalMove(board, from, asColor),
      ...alignAxisMove(board, from, asColor),
    ];
  }
  export function ofQueen(chess: Chess, from: number, asColor?: PieceColor) {
    const moves: Move[] = _ofQueen(chess.board, from, asColor);
    return moves;
  }

  function _ofKing(board: Board, from: number, asColor?: PieceColor) {
    const moves: Move[] = [];

    const { x, y } = Coords.getCoords(from);

    if (!asColor) asColor = board[from].color;

    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      for (let xOffset = -1; xOffset <= 1; xOffset++) {
        if (xOffset === 0 && yOffset === 0) continue;

        const xFinal = x + xOffset;
        const yFinal = y + yOffset;

        if (xFinal < 0 || xFinal > 7 || yFinal < 0 || yFinal > 7) continue;

        const to = Coords.getOffset(xFinal, yFinal);
        const current = board[to];
        if (current.color === asColor) continue;
        moves.push({ from, to, captureType: current.type });
      }
    }

    return moves;
  }

  export function ofKing(chess: Chess, from: number, asColor?: PieceColor) {
    const moves: Move[] = _ofKing(chess.board, from, asColor);

    if (asColor == PieceColor.NONE) return moves;

    const kingPos = asColor === PieceColor.WHITE
      ? ChessBoards.WHITE_KING_DEFAULT_POS
      : ChessBoards.BLACK_KING_DEFAULT_POS;

    if (kingPos !== from) return moves;

    const king = chess.board[kingPos];

    if (king.moved > 0) return moves;

    // castle
    if (king.type !== PieceType.KING && king.color !== asColor) {
      return moves;
    }

    // Queen's side
    if (
      !chess.board[from - 4].moved &&
      chess.board[from - 1].type === PieceType.NONE &&
      chess.board[from - 2].type === PieceType.NONE
    ) {
      moves.push({
        from,
        to: from - 2,
        captureType: PieceType.NONE,
        resultingMove: {
          from: from - 4,
          to: from - 1,
          captureType: PieceType.NONE,
        },
      });
    }

    // King's side
    if (
      !chess.board[from + 3].moved &&
      chess.board[from + 1].type === PieceType.NONE &&
      chess.board[from + 2].type === PieceType.NONE
    ) {
      moves.push({
        from,
        to: from + 2,
        captureType: PieceType.NONE,
        resultingMove: {
          from: from + 3,
          to: from + 1,
          captureType: PieceType.NONE,
        },
      });
    }

    return moves;
  }

  export function getEnpassantTargetOffset(chess: Chess) {
    const move = chess.getLastMove();

    if (
      move &&
      chess.board[move.to].type === PieceType.PAWN &&
      Math.abs(move.to - move.from) === Direction.DOWN * 2
    ) {
      // mid
      return (move.to + move.from) / 2;
    }
    return null;
  }

  function alignAxisMove(
    board: Board,
    from: number,
    asColor?: PieceColor,
  ) {
    const moves: Move[] = [];
    const { up, down, left, right } = ChessBoards.numToEdge[from];
    const lines: MoveLine[] = [
      {
        dir: { x: 0, y: -1 },
        steps: up,
      },
      {
        dir: { x: 1, y: 0 },
        steps: right,
      },
      {
        dir: { x: 0, y: 1 },
        steps: down,
      },
      {
        dir: { x: -1, y: 0 },
        steps: left,
      },
    ];
    const currentColor = asColor ? asColor : board[from].color;
    const opponentColor = Pieces.invertColor(currentColor);
    for (const line of lines) {
      let to = Coords.getCoords(from);
      while (line.steps > 0) {
        Coords.addCoords(to, line.dir);
        if (to.x < 0 || to.x > 7 || to.y < 0 || to.y > 7) break;
        const toOffset = Coords.getOffset(to.x, to.y);
        const current = board[toOffset];
        if (current.color === currentColor) break;
        moves.push({ from, to: toOffset, captureType: current.type });
        if (current.color === opponentColor) break;
        line.steps--;
      }
    }

    return moves;
  }

  function diagonalMove(
    board: Board,
    from: number,
    asColor?: PieceColor,
  ) {
    const moves: Move[] = [];
    const { upRight, downRight, downLeft, upLeft } =
      ChessBoards.numToEdge[from];
    const lines: MoveLine[] = [
      {
        dir: { x: 1, y: -1 },
        steps: upRight,
      },
      {
        dir: { x: 1, y: 1 },
        steps: downRight,
      },
      {
        dir: { x: -1, y: 1 },
        steps: downLeft,
      },
      {
        dir: { x: -1, y: -1 },
        steps: upLeft,
      },
    ];
    const currentColor = asColor ? asColor : board[from].color;
    const opponentColor = Pieces.invertColor(currentColor);
    for (const line of lines) {
      let to = Coords.getCoords(from);
      while (line.steps > 0) {
        Coords.addCoords(to, line.dir);
        if (to.x < 0 || to.x > 7 || to.y < 0 || to.y > 7) break;
        const toOffset = Coords.getOffset(to.x, to.y);
        const current = board[toOffset];
        if (current.color === currentColor) break;
        moves.push({ from, to: toOffset, captureType: current.type });
        if (current.color === opponentColor) break;
        line.steps--;
      }
    }

    return moves;
  }

  // function makeTestMove(realBoard: Board, move: Move) {
  //   const board = ChessBoards.copy(realBoard);
  // }

  export function generateMoves(chess: Chess) {
    const moves: Move[][] = [];
    const kingIndex = ChessBoards.getKingIndex(chess.board, chess.current);

    let checkMate = true;
    let staleMate = false;

    // Generate moves
    for (let offset = 0; offset < ChessBoards.BOARD_SIZE; offset++) {
      if (chess.board[offset].color === chess.current) {
        moves[offset] = getLegalMoves(chess, offset, kingIndex);
        if (checkMate) {
          checkMate = moves[offset].length === 0;
        }
        continue;
      }
      moves[offset] = [];
    }

    const lastMove = chess.getLastMove();
    if (attacked(chess.board, kingIndex) && lastMove) {
      lastMove.check = kingIndex;
    }

    if (checkMate && !attacked(chess.board, kingIndex)) {
      staleMate = true;
      checkMate = false;
      if (lastMove) {
        lastMove.check = kingIndex;
      }
    }

    return { moves, checkMate, staleMate };
  }

  export function getLegalMoves(
    chess: Chess,
    from: number,
    kingIndex: number,
  ): Move[] {
    let moves = getLegalAndIllegalMoves(chess, from);

    moves = moves.filter((move) => {
      const legal = isLegal(chess.board, move, kingIndex);
      return legal;
    });

    return moves;
  }

  export function getLegalAndIllegalMoves(chess: Chess, from: number) {
    switch (chess.board[from].type) {
      case PieceType.BISHOP:
        return ofBishop(chess, from, chess.board[from].color);
      case PieceType.KING:
        return ofKing(chess, from, chess.board[from].color);
      case PieceType.KNIGHT:
        return ofKnight(chess, from, chess.board[from].color);
      case PieceType.PAWN:
        return ofPawn(chess, from, chess.board[from].color);
      case PieceType.QUEEN:
        return ofQueen(chess, from, chess.board[from].color);
      case PieceType.ROOK:
        return ofRook(chess, from, chess.board[from].color);
      default:
        return [];
    }
  }

  export function isLegal(board: Board, testMove: Move, kingIndex: number) {
    if (board[testMove.to].color === board[testMove.from].color) {
      return false;
    }

    if (board[testMove.from].type === PieceType.KING) {
      // if castling
      if (testMove.resultingMove) {
        const offset = testMove.to - testMove.from;
        const sign = offset / Math.abs(offset);
        const range = sign === 1 ? 2 : 3;
        for (let i = 1; i <= range; i++) {
          if (board[kingIndex + i * sign].type !== PieceType.NONE) {
            return false;
          }
        }
        const mid = (testMove.from + testMove.to) / 2;

        if (attacked(board, mid, board[kingIndex].color)) {
          return false;
        }

        if (
          attacked(board, testMove.to, board[kingIndex].color)
        ) {
          return false;
        }
      }
      kingIndex = testMove.to;
    }

    // TODO: optimize this (no copying)
    const boardCopy = ChessBoards.copy(board);

    move(boardCopy, testMove);
    const _attacked = attacked(boardCopy, kingIndex);
    return !_attacked;
  }

  export function move(board: Board, move_: Move) {
    const res = {
      enPassant: false,
      castle: false,
      capture: board[move_.to].type !== PieceType.NONE,
    };
    board[move_.to].type = board[move_.from].type;
    board[move_.to].color = board[move_.from].color;
    board[move_.from].type = PieceType.NONE;
    board[move_.from].color = PieceColor.NONE;

    if (move_.captureIndex) {
      board[move_.captureIndex].color = PieceColor.NONE;
      board[move_.captureIndex].type = PieceType.NONE;
      board[move_.captureIndex].moved++;
      res.enPassant = true;
      res.capture = true;
    }

    if (move_.resultingMove) {
      move(board, move_.resultingMove);
      res.castle = true;
    }

    board[move_.from].moved++;
    if (move_.captureType !== PieceType.NONE) board[move_.to].moved++;

    return res;
  }

  export function undoMove(board: Board, move: Move) {
    const col = board[move.to].color;

    if (move.resultingMove) {
      undoMove(board, move.resultingMove);
    }

    board[move.from].type = board[move.to].type;
    board[move.from].color = board[move.to].color;
    board[move.to].type = move.captureType;
    board[move.to].color = Pieces.invertColor(col);

    if (move.captureIndex) {
      board[move.captureIndex].color = Pieces.invertColor(col);
      board[move.captureIndex].type = move.captureType;
      board[move.captureIndex].moved--;
    }

    if (move.promoteToType) {
      board[move.from].type = PieceType.PAWN;
    }

    board[move.from].moved--;

    if (move.captureType !== PieceType.NONE) board[move.to].moved--;
  }

  export function attacked(
    board: Board,
    from: number,
    asColor?: PieceColor,
  ): boolean {
    const moveFuncs = [
      diagonalMove,
      alignAxisMove,
      _ofKing,
      _ofKnight,
    ];

    const movePieces = [
      [PieceType.BISHOP, PieceType.QUEEN],
      [PieceType.ROOK, PieceType.QUEEN],
      [PieceType.KING],
      [PieceType.KNIGHT],
    ];

    for (const idx in moveFuncs) {
      const moves = moveFuncs[idx](board, from, asColor);
      const res = moves.find((move) => {
        return movePieces[idx].find((type) => {
          return type == move.captureType;
        });
      });
      if (res) {
        return true;
      }
    }

    const opponentColor = Pieces.invertColor(
      asColor ? asColor : board[from].color,
    );

    // for pawns
    const offset = (opponentColor) === PieceColor.BLACK
      ? Direction.UP
      : Direction.DOWN;
    if (from + offset < 0 && from + offset >= ChessBoards.BOARD_SIZE) {
      return false;
    }
    if (from % 8 != 0) {
      const piece = board[from + offset + Direction.LEFT];
      if (piece.type === PieceType.PAWN && piece.color === opponentColor) {
        return true;
      }
    }
    if ((from - 7) % 8 != 0) {
      const piece = board[from + offset + Direction.RIGHT];
      if (piece.type === PieceType.PAWN && piece.color === opponentColor) {
        return true;
      }
    }
    return false;
  }
}
