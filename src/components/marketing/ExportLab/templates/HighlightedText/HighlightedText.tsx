import { tokenizeHighlights } from "../../utils/tokenizeHighlights";

interface Props {
  text: string;
}

/** Template text with marked fragments in the accent color and the markers hidden. */
const HighlightedText = ({ text }: Props) =>
  tokenizeHighlights(text).map((token, index) => {
    if (token.kind === "marker") return null;
    const key = `${index}-${token.kind}`;
    return token.kind === "highlight" ? (
      <span key={key} className="text-app-accent">
        {token.text}
      </span>
    ) : (
      <span key={key}>{token.text}</span>
    );
  });

export default HighlightedText;
