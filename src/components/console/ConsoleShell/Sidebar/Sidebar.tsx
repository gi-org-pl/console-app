import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faTableCellsLarge } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, NavLink, useLocation } from "react-router";
import { twMerge } from "tailwind-merge";
import consoleLogo from "../../../../assets/icons/console-logo.svg";
import { CONSOLE_MODULES } from "../../../../constants/console";
import Eyebrow from "../../../shared/Eyebrow/Eyebrow";
import AccountControl from "./AccountControl/AccountControl";

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  twMerge(
    "flex items-center gap-2 rounded-lg px-4 py-2 text-base text-app-muted hover:bg-app-hover",
    isActive &&
      "bg-app-active font-semibold text-app-text shadow-[inset_3px_0_0_var(--color-app-accent)] hover:bg-app-active [&_svg]:text-app-accent-text",
  );

// A plain, lighter-weight list item: it reads as nested under the module pill above it,
// not as a sibling competing with it for attention.
const subNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  twMerge(
    "block rounded-md px-3 py-1.5 text-sm text-app-muted hover:bg-app-hover hover:text-app-text",
    isActive && "font-semibold text-app-accent-text",
  );

const NavItem = ({
  to,
  icon,
  label,
}: {
  to: string;
  icon: IconDefinition;
  label: string;
}) => (
  <NavLink to={to} end={to === "/"} className={navLinkClassName}>
    <FontAwesomeIcon icon={icon} fixedWidth />
    {label}
  </NavLink>
);

const Sidebar = () => {
  const { pathname } = useLocation();

  return (
    <aside className="flex flex-col gap-4 border-b border-app-border bg-app-bg p-4 sm:sticky sm:top-0 sm:h-screen sm:gap-0 sm:border-r sm:border-b-0 sm:py-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/"
          aria-label="Console — strona główna"
          className="shrink-0 px-4"
        >
          <img
            className="block h-auto w-28 sm:w-36 desktop:w-44"
            src={consoleLogo}
            width={477}
            height={96}
            alt=""
          />
        </Link>
        <AccountControl className="justify-end sm:hidden" />
      </div>
      <Eyebrow className="mt-8 mb-2 hidden px-4 sm:block">
        Przestrzeń robocza
      </Eyebrow>
      <nav aria-label="Nawigacja główna" className="flex flex-col gap-1">
        <div className="flex flex-wrap gap-2 sm:grid">
          <NavItem to="/" icon={faTableCellsLarge} label="Pulpit" />
          {CONSOLE_MODULES.map((module) => (
            <NavItem
              key={module.path}
              to={module.path}
              icon={module.icon}
              label={module.name}
            />
          ))}
        </div>
        {CONSOLE_MODULES.map(
          (module) =>
            module.subModules &&
            pathname.startsWith(module.path) && (
              <div
                key={module.path}
                className="mb-2 ml-4 flex flex-col gap-0.5 border-l border-app-border pl-2"
                aria-label={`Podmoduły: ${module.name}`}
              >
                {module.subModules.map((subModule) => (
                  <NavLink
                    key={subModule.path}
                    to={subModule.path}
                    end
                    className={subNavLinkClassName}
                  >
                    {subModule.name}
                  </NavLink>
                ))}
              </div>
            ),
        )}
      </nav>
      {/* Same height as the three-line footer, so both top borders line up. */}
      <AccountControl className="mt-auto hidden h-[77px] border-t border-app-border pt-4 sm:flex" />
    </aside>
  );
};

export default Sidebar;
