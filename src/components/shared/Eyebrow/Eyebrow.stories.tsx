import type { Meta, StoryObj } from "@storybook/react-vite";
import Eyebrow from "./Eyebrow";

const meta = {
  title: "shared/Eyebrow",
  component: Eyebrow,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "Przestrzeń zespołu" },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
