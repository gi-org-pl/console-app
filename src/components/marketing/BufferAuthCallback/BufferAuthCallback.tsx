import { useEffect } from "react";
import PageHeading from "../../shared/PageHeading/PageHeading";

/**
 * Target of the Worker's post-login redirect (`${APP_ORIGIN}/buffer-auth#<state>`), opened
 * in a popup. Cloudflare Access having let the request through here is itself the proof of
 * login; this just hands the state back to the opener and closes.
 */
const BufferAuthCallback = () => {
  useEffect(() => {
    const state = window.location.hash.slice(1);
    window.opener?.postMessage(
      { type: "buffer-auth", state },
      window.location.origin,
    );
    window.close();
  }, []);

  return (
    <PageHeading
      isCompact
      eyebrow="Marketing / Publikacja"
      title="Logowanie do Buffer zakończone"
      description="To okno powinno zamknąć się automatycznie."
    />
  );
};

export default BufferAuthCallback;
