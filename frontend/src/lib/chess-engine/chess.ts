import { Arrays } from "$lib/chess-engine/utils/arrays";
import { type Board, ChessBoards } from "./board";
import { type Move, Moves } from "./move";
import { PieceColor, Pieces, PieceType } from "./piece";

export type GameOverReason = "" | "checkMate" | "staleMate";

export interface ChessProps {
  /**
   * Usefull when implementing a multiplayer chess game -
   * This will prevent user action on selecting or moving
   * other player's piece
   *
   * For black:
   * ```ts
   * freezeOn = [PieceColor.WHITE]
   * ```
   *
   * For white:
   * ```ts
   * freezeOn = [PieceColor.BLACK]
   * ```
   *
   * For watcher (cannot move):
   * ```ts
   * freezeOn = [PieceColor.WHITE, PieceColor.BLACK]
   * ```
   *
   * For simulating other player's move, you can use the
   * `simulateClicksToMove` function that will require you
   * to pass in
   * `{from: number, to: number, promoteTo?: PieceType}`
   */
  freezeOn?: PieceColor[];
  onGameOver?: (reason: GameOverReason) => void;
  onMove?: (move: Move) => void;
  onCastle?: (move: Move) => void;
  onCapture?: (move: Move) => void;
  onEnpassant?: (move: Move) => void;
  onUndo?: (move: Move) => void;
}

export default class Chess {
  board: Board;
  validMoves: Move[][] = [];
  moveHistory: Move[] = [];
  selectedOffset: number = -1;
  current: PieceColor = PieceColor.WHITE;
  gameOver = false;
  gameOverReason: GameOverReason = "";
  freezeOn: PieceColor[] = [];
  onGameOver: (reason: GameOverReason) => void;
  onMove: (move: Move) => void;
  onCastle: (move: Move) => void;
  onCapture: (move: Move) => void;
  onEnpassant: (move: Move) => void;
  onUndo: (move: Move) => void;

  constructor(
    { freezeOn, onCapture, onCastle, onEnpassant, onGameOver, onMove, onUndo }:
      ChessProps,
  ) {
    this.board = ChessBoards.emptyBoard();
    ChessBoards.initPosition(this.board);
    this.generateMoves();
    this.freezeOn = freezeOn || [];
    const _onmove = () => {};
    const _onundo = () => {};
    const _oncapture = () => {};
    const _oncastle = () => {};
    const _onenpassant = () => {};
    const _ongameover = () => {};
    this.onMove = onMove || _onmove;
    this.onUndo = onUndo || _onundo;
    this.onCapture = onCapture || _oncapture;
    this.onCastle = onCastle || _oncastle;
    this.onEnpassant = onEnpassant || _onenpassant;
    this.onGameOver = onGameOver || _ongameover;
  }

  /**
   * Switch current player && generate available moves
   */
  next() {
    this.onMove(this.getLastMove()!);
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
   * Perform `select`, `move`, or `deselect` automatically
   *
   * @param offset offset of the tile to select
   * @param force move even if it is not our turn (default: false)
   */
  clickTile(offset: number, force: boolean = false) {
    if (!force) {
      if (this.freezeOn.includes(this.current)) {
        return "frozen";
      }
    }
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
    }
    // deselect
    this.selectedOffset = -1;

    return "deselect";
  }

  /**
   * @param from first click
   * @param to second click
   * @param promoteTo third click (if promoting)
   *
   * @returns true if the move is valid
   */
  simulateClicksToMove(from: number, to: number, promoteTo?: PieceType) {
    if (
      !this.validMoves[from].find((move) => move.to === to)
    ) {
      return false;
    }

    this.clickTile(from, true);
    this.clickTile(to, true);
    if (promoteTo) {
      if (!this.isPromote()) {
        this.undo();
        throw new Error(
          "The move cannot be performed because the move was not supposed to be a promoting move",
        );
      }
      this.promoteLastMoveTo(promoteTo);
    }

    // TODO: make a iterable version of this function so that we don't need to call the generate function over and over
    this.current = Pieces.invertColor(this.current);
    this.generateMoves();
    return true;
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

  lastMoveColor() {
    const lastMove = this.getLastMove();
    if (!lastMove) return null;
    return this.board[lastMove.to].color;
  }

  move(move: Move) {
    this.moveHistory.push(move);
    const { capture, castle, enPassant } = Moves.move(this.board, move);
    if (capture) this.onCapture(move);
    if (castle) this.onCastle(move);
    if (enPassant) this.onEnpassant(move);
  }

  undo() {
    this.gameOver = false;
    this.gameOverReason = "";
    const move = this.moveHistory.pop();
    if (!move) return;
    Moves.undoMove(this.board, move);
    this.current = Pieces.invertColor(this.current);
    this.generateMoves();
    this.onUndo(move);
  }

  currentRole() {
    return this.current === PieceColor.WHITE ? "white" : "black";
  }

  setRole(role: "black" | "white" | "watching") {
    Arrays.clear(this.freezeOn);
    if (role === "black") {
      this.freezeOn.push(PieceColor.WHITE);
    } else if (role === "white") {
      this.freezeOn.push(PieceColor.BLACK);
    } else {
      this.freezeOn.push(PieceColor.BLACK, PieceColor.WHITE);
    }
  }
}
