import {
  faArrowRightFromBracket,
  faArrowRightToBracket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@gi-org-pl/athena";
import { twMerge } from "tailwind-merge";
import { useBufferSessionStore } from "../../../../../services/buffer/utils/useBufferSession";

interface Props {
  className?: string;
}

/** Log in, or the signed-in email with an icon-only log out. */
const AccountControl = ({ className }: Props) => {
  const { status, session, connect, logout } = useBufferSessionStore();

  if (status === "checking") {
    return <div className={className} aria-hidden="true" />;
  }

  return (
    <div className={twMerge("flex min-w-0 items-center gap-2", className)}>
      {session ? (
        <>
          <span
            title={session.email}
            className="min-w-0 flex-1 truncate text-sm text-app-muted"
          >
            {session.email}
          </span>
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Wyloguj"
            title="Wyloguj"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-app-border text-app-muted transition-colors hover:bg-app-hover hover:text-app-text"
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
          </button>
        </>
      ) : (
        <Button
          type="outlined"
          size="small"
          LeftIcon={<FontAwesomeIcon icon={faArrowRightToBracket} />}
          onClick={() => void connect()}
        >
          Zaloguj się
        </Button>
      )}
    </div>
  );
};

export default AccountControl;
