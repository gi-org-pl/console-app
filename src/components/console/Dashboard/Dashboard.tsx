import { CONSOLE_MODULES } from "../../../constants/console";
import PageHeading from "../../shared/PageHeading/PageHeading";
import SectionHeading from "../../shared/SectionHeading/SectionHeading";
import ComingSoonCard from "./ComingSoonCard/ComingSoonCard";
import ModuleCard from "./ModuleCard/ModuleCard";

const Dashboard = () => (
  <>
    <PageHeading
      eyebrow="Console"
      title={
        <>
          Narzędzia dla
          <br />
          wolontariuszy
        </>
      }
      description=""
    />
    <section aria-labelledby="modules-title">
      <SectionHeading id="modules-title" title="Dostępne narzędzia" />
      <div className="grid gap-4 tablet:grid-cols-[1.4fr_1fr] desktop:gap-8">
        {CONSOLE_MODULES.map((module, index) => (
          <ModuleCard key={module.path} module={module} position={index + 1} />
        ))}
        <ComingSoonCard />
      </div>
    </section>
  </>
);

export default Dashboard;
