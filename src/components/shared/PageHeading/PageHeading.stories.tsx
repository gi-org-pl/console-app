import type { Meta, StoryObj } from "@storybook/react-vite";
import PageHeading from "./PageHeading";

const meta = {
  title: "shared/PageHeading",
  component: PageHeading,
  tags: ["autodocs"],
  args: {
    eyebrow: "Przestrzeń zespołu",
    title: "Mniej klikania. Więcej działania",
    description: "Codzienne zadania fundacji. Jeden zestaw narzędzi.",
  },
} satisfies Meta<typeof PageHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  args: { isCompact: true, title: "Jedna treść. Cztery formaty" },
};
