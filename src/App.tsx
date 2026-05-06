import {
  Chessboard,
  PieceHandlerArgs,
  SquareHandlerArgs,
  type PieceDropHandlerArgs,
} from "react-chessboard";
import { Button } from "@/components/ui/button";
import { Dot } from "lucide-react";
import { useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { toast } from "sonner";

type Color = "White" | "Black";

function randomColor(): Color {
  return Math.random() > 0.5 ? "White" : "Black";
}

function getGameOverMessage(
  chess: Chess,
  playerColor: Color,
): { title: string; description: string } {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === "w" ? "Black" : "White";
    const playerWon = winner === playerColor;
    return {
      title: playerWon ? "You Win!" : "You Lose",
      description: playerWon
        ? "Checkmate! Well played."
        : "Checkmate. Better luck next time.",
    };
  }
  if (chess.isStalemate())
    return { title: "Stalemate", description: "No legal moves available." };
  if (chess.isDraw())
    return { title: "Draw", description: "The game ended in a draw." };
  if (chess.isThreefoldRepetition())
    return { title: "Draw", description: "Threefold repetition." };
  if (chess.isInsufficientMaterial())
    return { title: "Draw", description: "Insufficient material." };
  return { title: "Game Over", description: "The game has ended." };
}

export default function App() {
  const [playerColor, setPlayerColor] = useState<Color>("White");
  const [gameOverOpen, setGameOverOpen] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState({
    title: "",
    description: "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState({});
  const [promotionOpen, setPromotionOpen] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
  } | null>(null);

  function getMoveOptions(square: Square) {
    const moves = chessGame.moves({ square, verbose: true });

    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const piece = chessGame.get(square);

    const newSquares: Record<string, React.CSSProperties> = {};

    for (const move of moves) {
      const isCapture =
        chessGame.get(move.to) &&
        chessGame.get(move.to)?.color !== piece?.color;

      newSquares[move.to] = {
        background: isCapture
          ? "radial-gradient(circle, rgba(0,0,0,.6) 60%, transparent 60%)"
          : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    }

    newSquares[square] = { background: "rgba(255, 255, 0, 0.4)" };

    setOptionSquares(newSquares);
    return true;
  }

  function isPromotionMove(from: string, to: string) {
    const moves = chessGame.moves({ square: from as Square, verbose: true });
    return moves.some((m) => m.from === from && m.to === to && m.promotion);
  }

  function commitMove(from: string, to: string): boolean {
    if (isPromotionMove(from, to)) {
      setPendingPromotion({ from, to });
      setPromotionOpen(true);
      return false;
    }

    try {
      chessGame.move({ from, to });
    } catch {
      if (from === to) return false;
      toast.error("Invalid move", {
        description: "That move is not allowed.",
      });
      return false;
    }

    setChessPosition(chessGame.fen());
    setMoveFrom("");
    setOptionSquares({});

    if (chessGame.isGameOver()) {
      setGameOverMessage(getGameOverMessage(chessGame, playerColor));
      setGameOverOpen(true);
    }

    return true;
  }

  function finalizeMove() {
    setChessPosition(chessGame.fen());
    setMoveFrom("");
    setOptionSquares({});

    if (chessGame.isGameOver()) {
      setGameOverMessage(getGameOverMessage(chessGame, playerColor));
      setGameOverOpen(true);
    }
  }

  function handlePromotion(piece: "q" | "r" | "b" | "n") {
    if (!pendingPromotion) return;

    try {
      chessGame.move({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: piece,
      });
    } catch {
      toast.error("Invalid promotion");
    }

    setPromotionOpen(false);
    setPendingPromotion(null);

    finalizeMove();
  }

  function handleSquareInteraction(
    square: Square,
    piece?: string | null,
  ): "moved" | "selected" | "cleared" {
    if (
      piece &&
      (piece?.slice(0)[0] === "w" ? "White" : "Black") !== playerColor
    )
      return "cleared";

    if (!moveFrom) {
      if (piece && getMoveOptions(square)) {
        setMoveFrom(square);
        return "selected";
      }
      return "cleared";
    }

    const fromPiece = chessGame.get(moveFrom as Square);

    const isPlayersPiece =
      fromPiece?.color === (playerColor === "White" ? "w" : "b");

    const isPlayersTurn = turn() === playerColor;

    const moves = chessGame.moves({
      square: moveFrom as Square,
      verbose: true,
    });

    const isLegalTarget = moves.some(
      (m) => m.from === moveFrom && m.to === square,
    );

    if (isLegalTarget && isPlayersPiece && isPlayersTurn) {
      commitMove(moveFrom, square);
      return "moved";
    }

    if (piece && getMoveOptions(square)) {
      setMoveFrom(square);
      return "selected";
    }

    setMoveFrom("");
    setOptionSquares({});
    return "cleared";
  }

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    if (!targetSquare) return false;
    return commitMove(sourceSquare, targetSquare);
  }

  function onPieceDrag({ square, piece }: PieceHandlerArgs) {
    handleSquareInteraction(square as Square, piece?.pieceType);
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    handleSquareInteraction(square as Square, piece?.pieceType);
  }

  const turn = (): Color => (chessGame.turn() === "w" ? "White" : "Black");

  function canDragPiece({ piece }: PieceHandlerArgs) {
    if (turn() !== playerColor) return false;
    return piece.pieceType[0] === (playerColor === "White" ? "w" : "b");
  }

  function newGame() {
    chessGame.reset();
    setChessPosition(chessGame.fen());
    setPlayerColor(randomColor());
    setGameOverOpen(false);
    setConfirmOpen(false);
  }

  function handleNewGameClick() {
    if (chessGame.history().length === 0 || chessGame.isGameOver()) {
      newGame();
    } else {
      setConfirmOpen(true);
    }
  }

  const chessboardOptions = {
    position: chessPosition,
    onPieceDrop,
    boardOrientation: playerColor.toLowerCase() as "white" | "black",
    onPieceDrag,
    canDragPiece,
    onSquareClick,
    squareStyles: optionSquares,
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <Button onClick={handleNewGameClick}>New Game</Button>
        <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
          <PopoverAnchor />
          <PopoverContent className="w-64">
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-semibold text-sm">Abandon current game?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your progress will be lost.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={newGame}>
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="max-w-xl">
        <Chessboard options={chessboardOptions} />
      </div>

      <div className="flex items-center gap-4 text-xs tracking-wider text-muted-foreground">
        <span>
          Playing as <span className="font-bold text-white">{playerColor}</span>
        </span>
        <Dot />
        <span>{turn()}'s turn</span>
      </div>

      <Dialog open={gameOverOpen} onOpenChange={setGameOverOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {gameOverMessage.title}
            </DialogTitle>
            <DialogDescription>{gameOverMessage.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={newGame} className="w-full">
              Play Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={promotionOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Promote Pawn</DialogTitle>
            <DialogDescription>
              Choose a piece to promote your pawn to.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-2 py-4">
            <Button onClick={() => handlePromotion("q")}>Queen</Button>
            <Button onClick={() => handlePromotion("r")}>Rook</Button>
            <Button onClick={() => handlePromotion("b")}>Bishop</Button>
            <Button onClick={() => handlePromotion("n")}>Knight</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
