import {
  Chessboard,
  PieceHandlerArgs,
  SquareHandlerArgs,
  type PieceDropHandlerArgs,
} from "react-chessboard";
import { Button } from "@/components/ui/button";
import { Dot, Loader } from "lucide-react";
import { useRef, useState, useEffect } from "react";
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
import { getBotMove } from "@/api/bot";
import { type Host } from "./HostList";
import EvalBar from "@/components/EvalBar";
import { useStockfishEval } from "@/lib/useStockfishEval";

type Props = {
  onColorsAssigned: (
    player1: "White" | "Black",
    player2: "White" | "Black",
  ) => void;
  humanColor?: Color;
  player1HostId: string;
  player2HostId: string;
  player1Color: "White" | "Black";
  player2Color: "White" | "Black";
  hosts: Host[];
  timeout: number;
  stockfishDepth: number;
  botDelay: number;
};

type Color = "White" | "Black";

function randomColor(): Color {
  return Math.random() > 0.5 ? "White" : "Black";
}

function getGameOverMessage(chess: Chess): {
  title: string;
  description: string;
} {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === "w" ? "Black" : "White";
    return {
      title: `${winner} Won!`,
      description: "Checkmate",
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

const LOCAL_STORAGE_KEY = "chess-local-game";

type PersistedGameState = {
  fen: string;
  turn: number;
};

function saveGameToLocalStorage(data: PersistedGameState) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function loadGameFromLocalStorage(): PersistedGameState | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.fen !== "string" || typeof parsed.turn !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function initChessGame(): Chess {
  const stored = loadGameFromLocalStorage();
  const game = new Chess();
  if (stored) {
    try {
      game.load(stored.fen);
    } catch {}
  }
  return game;
}

export default function ChessGame({
  onColorsAssigned,
  humanColor,
  player1HostId,
  player2HostId,
  player1Color,
  player2Color,
  hosts,
  timeout,
  stockfishDepth,
  botDelay,
}: Props) {
  const [gameOverOpen, setGameOverOpen] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState({
    title: "",
    description: "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botErrorOpen, setBotErrorOpen] = useState(false);
  const [botErrorDescription, setBotErrorDescription] = useState("");

  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState({});
  const [promotionOpen, setPromotionOpen] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const chessGameRef = useRef<Chess | null>(null);
  if (chessGameRef.current === null) {
    chessGameRef.current = initChessGame();
  }
  const chessGame = chessGameRef.current;

  const storedTurn = loadGameFromLocalStorage()?.turn;
  const [turnNumber, setTurnNumber] = useState<number>(storedTurn || 1);
  const [chessPosition, setChessPosition] = useState(chessGame.fen());

  const turn = (): Color => (chessGame.turn() === "w" ? "White" : "Black");

  const evalResult = useStockfishEval(chessPosition, turn() === "White", 15);

  function saveMove() {
    saveGameToLocalStorage({
      fen: chessGame.fen(),
      turn: turnNumber + 1,
    });
    setTurnNumber(turnNumber + 1);
  }

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
      return false;
    }
    setChessPosition(chessGame.fen());
    setMoveFrom("");
    setOptionSquares({});
    saveMove();
    if (chessGame.isGameOver()) {
      setGameOverMessage(getGameOverMessage(chessGame));
      setGameOverOpen(true);
    }
    return true;
  }

  function finalizeMove() {
    setChessPosition(chessGame.fen());
    setMoveFrom("");
    setOptionSquares({});
    saveMove();
    if (chessGame.isGameOver()) {
      setGameOverMessage(getGameOverMessage(chessGame));
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
  ): void {
    const currentTurnHost = getCurrentTurnHost();
    const isHumanTurn = currentTurnHost?.id === "human";

    if (!isHumanTurn) {
      return;
    }

    const currentColor = turn();

    if (!moveFrom) {
      if (piece) {
        const pieceColor = piece.slice(0)[0] === "w" ? "White" : "Black";
        if (pieceColor === currentColor && getMoveOptions(square)) {
          setMoveFrom(square);
        }
      }
      return;
    }

    const moves = chessGame.moves({
      square: moveFrom as Square,
      verbose: true,
    });
    const isLegalTarget = moves.some(
      (m) => m.from === moveFrom && m.to === square,
    );

    if (isLegalTarget) {
      commitMove(moveFrom, square);
      return;
    }

    if (piece) {
      const pieceColor = piece.slice(0)[0] === "w" ? "White" : "Black";
      if (pieceColor === currentColor && getMoveOptions(square)) {
        setMoveFrom(square);
        return;
      }
    }

    setMoveFrom("");
    setOptionSquares({});
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

  function canDragPiece({ piece }: PieceHandlerArgs) {
    const currentTurnHost = getCurrentTurnHost();
    const isHumanTurn = currentTurnHost?.id === "human";

    if (!isHumanTurn || isBotThinking) return false;

    const currentColor = turn();
    const pieceColor = piece.pieceType[0] === "w" ? "White" : "Black";
    return pieceColor === currentColor;
  }

  function getCurrentTurnHost(): Host | null {
    const currentColor = turn();
    const hostId =
      currentColor === "White"
        ? player1Color === "White"
          ? player1HostId
          : player2HostId
        : player1Color === "Black"
          ? player1HostId
          : player2HostId;
    return hosts.find((h) => h.id === hostId) || null;
  }

  const isBotThinkingRef = useRef(false);

  useEffect(() => {
    const currentTurnHost = getCurrentTurnHost();
    if (
      !currentTurnHost ||
      currentTurnHost.id === "human" ||
      botErrorDescription !== "" ||
      chessGame.isGameOver() ||
      isBotThinkingRef.current
    ) {
      return;
    }

    let cancelled = false;

    const fetchBotMove = async () => {
      isBotThinkingRef.current = true;
      setIsBotThinking(true);
      try {
        if (botDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, botDelay * 1000));
        }

        if (cancelled) return;

        const move = await getBotMove(
          chessGame.fen(),
          currentTurnHost,
          timeout,
          stockfishDepth,
        );

        if (cancelled) return;

        if (!move) {
          setBotErrorDescription(
            "Failed to get a move from the bot (timeout or error)",
          );
          setBotErrorOpen(true);
          setIsBotThinking(false);
          return;
        }

        const from = move.substring(0, 2) as Square;
        const to = move.substring(2, 4) as Square;
        const promotion = move.length > 4 ? move[4] : undefined;

        try {
          chessGame.move({ from, to, promotion: promotion as any });
          setChessPosition(chessGame.fen());
          setMoveFrom("");
          setOptionSquares({});
          saveGameToLocalStorage({
            fen: chessGame.fen(),
            turn: turnNumber + 1,
          });
          setTurnNumber(turnNumber + 1);

          if (chessGame.isGameOver()) {
            setGameOverMessage(getGameOverMessage(chessGame));
            setGameOverOpen(true);
          }
        } catch (error) {
          setBotErrorDescription("The bot returned an invalid move");
          setBotErrorOpen(true);
        }
      } finally {
        if (!cancelled) {
          isBotThinkingRef.current = false;
          setIsBotThinking(false);
        }
      }
    };

    fetchBotMove();
    return () => {
      cancelled = true;
      isBotThinkingRef.current = false;
    };
  }, [
    player1HostId,
    player2HostId,
    player1Color,
    player2Color,
    timeout,
    stockfishDepth,
    botDelay,
    turnNumber,
    humanColor,
  ]);

  function newGame() {
    chessGame.reset();
    const newColor = randomColor();

    onColorsAssigned(newColor, newColor === "White" ? "Black" : "White");

    setChessPosition(chessGame.fen());

    setGameOverOpen(false);
    setConfirmOpen(false);
    setBotErrorOpen(false);
    setBotErrorDescription("");
    saveGameToLocalStorage({
      fen: chessGame.fen(),
      turn: 1,
    });
    setTurnNumber(1);
  }

  function handleNewGameClick() {
    if (turnNumber === 1 || chessGame.isGameOver()) {
      newGame();
    } else {
      setConfirmOpen(true);
    }
  }

  const chessboardOptions = {
    position: chessPosition,
    onPieceDrop,
    boardOrientation: humanColor
      ? (humanColor.toLowerCase() as "white" | "black")
      : "white",
    onPieceDrag,
    canDragPiece,
    onSquareClick,
    squareStyles: optionSquares,
  };

  return (
    <>
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

        <div className="flex items-stretch gap-4">
          <div className="w-8 shrink-0">
            <EvalBar
              evalPercent={evalResult.evalPercent}
              isWhiteBottom={
                humanColor ? humanColor.toLowerCase() === "white" : true
              }
              evalText={evalResult.evalText}
            />
          </div>
          <div className="max-w-xl shrink-0">
            <Chessboard options={chessboardOptions} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs tracking-wider text-muted-foreground">
          <span>
            <span className="font-bold text-white">{turn()}'s</span> turn
          </span>
          <Dot />
          <span>Move {turnNumber}</span>
          {isBotThinking && (
            <>
              <Dot />
              <span className="flex items-center gap-1 text-yellow-500">
                <Loader className="w-3 h-3 animate-spin" />
                Bot is thinking...
              </span>
            </>
          )}
        </div>
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

      <Dialog open={botErrorOpen} onOpenChange={setBotErrorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Bot Error</DialogTitle>
            <DialogDescription>{botErrorDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={newGame} className="w-full">
              Restart Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
