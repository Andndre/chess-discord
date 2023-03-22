import { Arrays } from "$lib/chess-engine/utils/arrays";
import { type Board, ChessBoards } from "./board";
import { type Move, Moves } from "./move";
import { PieceColor, Pieces, PieceType } from "./piece";

export type GameOverReason = "" | "checkMate" | "staleMate";

export default class Chess {
  board: Board;
  validMoves: Move[][] = [];
  moveHistory: Move[] = [];
  selectedOffset: number = -1;
  current: PieceColor = PieceColor.WHITE;
  gameOver = false;
  gameOverReason: GameOverReason = "";
  onGameOver: (reason: GameOverReason) => void = () => {};
  onMove: (move: Move) => void = () => {};
  onCastle: (move: Move) => void = () => {};
  onCapture: (move: Move) => void = () => {};
  onEnpassant: (move: Move) => void = () => {};
  onUndo: () => void = () => {};

  constructor() {
    this.board = ChessBoards.emptyBoard();
    ChessBoards.initPosition(this.board);
    this.generateMoves();
  }

  /**
   * Switch current player && generate available moves
   */
  next() {
    console.clear();
    this.current = Pieces.invertColor(this.current);
    this.generateMoves();
  }

  private generateMoves() {
    if (this.gameOver) return;
    Arrays.clear(this.validMoves);
    const { moves, checkMate, staleMate } = Moves.generateMoves(
      this,
    );
    if (checkMate) {
      this.gameOver = true;
      this.gameOverReason = "checkMate";
      this.onGameOver(this.gameOverReason);
    } else if (staleMate) {
      this.gameOver = true;
      this.gameOverReason = "staleMate";
      this.onGameOver(this.gameOverReason);
    }

    this.validMoves.push(...moves);
  }

  isPromote() {
    const lastMove = this.getLastMove();
    if (!lastMove) return false;

    return !!lastMove.promoteToType;
  }

  /**
   * Perform `select`, `move`, or `deselect`
   *
   * @param offset
   */
  clickTile(offset: number) {
    const isFriendly = this.board[offset].color === this.current;
    if (isFriendly) {
      // select
      this.selectedOffset = offset;
      return "select";
    } else if (
      this.selectedOffset != -1 &&
      this.validMoves[this.selectedOffset].find((move) => move.to === offset)
    ) {
      // move
      const move = this.validMoves[this.selectedOffset].find((move) => {
        return move.to === offset;
      })!;
      this.move(move);
      this.selectedOffset = -1;
      return "move";
    } else {
      // deselect
      this.selectedOffset = -1;
      return "deselect";
    }
  }

  promoteLastMoveTo(type: PieceType) {
    const lastMove = this.getLastMove();
    if (!lastMove) return;
    lastMove.promoteToType = type;
    this.board[lastMove.to].type = type;
  }

  getLastMove() {
    return Arrays.last(this.moveHistory);
  }

  move(move: Move) {
    this.moveHistory.push(move);
    const { capture, castle, enPassant } = Moves.move(this.board, move);
    this.onMove(move);
    if (capture) this.onCapture(move);
    if (castle) this.onCastle(move);
    if (enPassant) this.onEnpassant(move);
  }

  undo() {
    const move = this.moveHistory.pop();
    if (!move) return;
    Moves.undoMove(this.board, move);
    this.onUndo();
    this.next();
  }
}
