import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useId } from "react";
import { Link } from "react-router";
import type { ConsoleModule } from "../../../../types/console";
import Eyebrow from "../../../shared/Eyebrow/Eyebrow";

interface Props {
  module: ConsoleModule;
  position: number;
}

const ModuleCard = ({ module, position }: Props) => {
  const id = useId();

  return (
    <article>
      <Link
        to={module.path}
        aria-labelledby={`${id}-name ${id}-cta`}
        className="group block h-full overflow-hidden rounded-[14px] border border-app-border bg-app-surface transition-colors duration-200 hover:border-app-border-strong hover:bg-app-surface-2"
      >
        <div
          aria-hidden="true"
          className="flex h-56 items-center justify-center gap-4 overflow-hidden bg-app-art p-4 sm:h-64 desktop:gap-8"
        >
          <div className="relative h-[204px] w-[175px] shrink-0 translate-y-[21px] -rotate-8 overflow-hidden rounded-[3px] border border-app-border bg-app-surface p-4 shadow-[8px_14px_24px_rgb(193_22_22/18%)] transition-transform duration-300 group-hover:translate-y-3 group-hover:-rotate-5 motion-reduce:transition-none">
            <strong className="mt-8 block font-display text-[21px] leading-[1.2] font-semibold tracking-[-0.7px]">
              Generacja
              <br />
              Innowacja
            </strong>
            <div className="mt-16 ml-8 size-[150px] rounded-full border-[13px] border-app-accent shadow-[0_0_0_12px_var(--color-app-surface),0_0_0_24px_var(--color-app-text)]" />
          </div>
          <div className="text-base desktop:text-2xl">
            Nasze grafiki
            <br />
            <b className="font-semibold">gotowe w parę sekund.</b>
          </div>
        </div>
        <div className="p-4 sm:p-8">
          <Eyebrow>
            {String(position).padStart(2, "0")} / {module.category}
          </Eyebrow>
          <h3
            id={`${id}-name`}
            className="my-2 font-display text-base font-semibold"
          >
            {module.name}
          </h3>
          <p className="mb-4 max-w-[416px] text-base text-app-muted">
            {module.description}
          </p>
          <span
            id={`${id}-cta`}
            className="inline-flex items-center gap-2 text-base font-semibold text-app-accent-text"
          >
            Otwórz moduł
            <FontAwesomeIcon
              icon={faArrowRight}
              className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
            />
          </span>
        </div>
      </Link>
    </article>
  );
};

export default ModuleCard;
