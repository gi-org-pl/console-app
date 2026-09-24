import { Badge } from "@gi-org-pl/athena";
import type { Meta, StoryObj } from "@storybook/react-vite";
import SectionHeading from "./SectionHeading";

const meta = {
  title: "shared/SectionHeading",
  component: SectionHeading,
  tags: ["autodocs"],
  args: { id: "section", title: "Twoje narzędzia" },
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBadge: Story = {
  args: {
    aside: (
      <Badge type="info" variant="secondary">
        Etap 1 · Fundament
      </Badge>
    ),
  },
};
