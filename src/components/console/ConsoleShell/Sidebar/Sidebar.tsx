import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faTableCellsLarge } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, NavLink } from "react-router";
import { twMerge } from "tailwind-merge";
import consoleLogo from "../../../../assets/icons/console-logo.svg";
import avatar from "../../../../assets/images/avatar.png";
import { CONSOLE_MODULES } from "../../../../constants/console";
import Eyebrow from "../../../shared/Eyebrow/Eyebrow";

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  twMerge(
    "flex items-center gap-2 rounded-lg px-4 py-2 text-base text-app-muted hover:bg-app-hover",
    isActive &&
      "bg-app-active font-semibold text-app-text shadow-[inset_3px_0_0_var(--color-app-accent)] hover:bg-app-active [&_svg]:text-app-accent-text",
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

const Sidebar = () => (
  <aside className="flex flex-col gap-4 border-b border-app-border bg-app-bg p-4 sm:sticky sm:top-0 sm:h-screen sm:gap-0 sm:border-r sm:border-b-0 sm:py-8">
    <Link
      to="/"
      aria-label="Console — strona główna"
      className="self-start px-4"
    >
      <img
        className="block h-auto w-28 sm:w-36 desktop:w-44"
        src={consoleLogo}
        width={477}
        height={96}
        alt=""
      />
    </Link>
    <Eyebrow className="mt-8 mb-2 hidden px-4 sm:block">
      Przestrzeń robocza
    </Eyebrow>
    <nav aria-label="Nawigacja główna" className="flex gap-2 sm:grid">
      <NavItem to="/" icon={faTableCellsLarge} label="Pulpit" />
      {CONSOLE_MODULES.map((module) => (
        <NavItem
          key={module.path}
          to={module.path}
          icon={module.icon}
          label={module.name}
        />
      ))}
    </nav>
    {/* Same height as the three-line footer, so both top borders line up. */}
    <div className="mt-auto hidden h-[77px] items-center gap-2 border-t border-app-border pt-4 text-base font-medium sm:flex">
      <img
        className="size-10 shrink-0 rounded-full border border-app-border object-cover"
        src={avatar}
        width={40}
        height={40}
        alt=""
      />
      Publiczny
    </div>
  </aside>
);

export default Sidebar;
