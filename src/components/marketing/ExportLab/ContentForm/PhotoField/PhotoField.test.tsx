import { fireEvent, render, screen } from "@testing-library/react";
import type { PhotoControls } from "../../ExportLab.types";
import PhotoField from "./PhotoField";

const createPhoto = (
  overrides: Partial<PhotoControls> = {},
): PhotoControls => ({
  photo: null,
  isLoading: false,
  error: "",
  select: vi.fn().mockResolvedValue(undefined),
  setFocus: vi.fn(),
  remove: vi.fn(),
  ...overrides,
});

const file = new File(["x"], "a.png", { type: "image/png" });

describe("<PhotoField />", () => {
  describe("when no photo is set", () => {
    it("offers a single upload target", () => {
      render(<PhotoField photo={createPhoto()} />);
      expect(screen.getByLabelText("Dodaj zdjęcie")).toHaveAttribute(
        "type",
        "file",
      );
      expect(screen.queryByRole("img")).toBeNull();
    });
  });

  describe("when a file is chosen", () => {
    it("passes it on and resets the input", () => {
      const photo = createPhoto();
      render(<PhotoField photo={photo} />);
      const input = screen.getByLabelText("Dodaj zdjęcie") as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });
      expect(photo.select).toHaveBeenCalledWith(file);
      expect(input.value).toBe("");
    });
  });

  describe("when a file is dropped on the upload target", () => {
    it("passes it on", () => {
      const photo = createPhoto();
      render(<PhotoField photo={photo} />);
      const target = screen.getByText("Dodaj zdjęcie");
      fireEvent.dragOver(target);
      fireEvent.drop(target, { dataTransfer: { files: [file] } });
      expect(photo.select).toHaveBeenCalledWith(file);
    });
  });

  describe("when the photo is loading or failed", () => {
    it("shimmers the upload target and announces the state", () => {
      render(
        <PhotoField photo={createPhoto({ isLoading: true, error: "Błąd" })} />,
      );
      expect(screen.getByTestId("shimmer")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(
        "Wczytywanie zdjęcia",
      );
      expect(screen.getByRole("alert")).toHaveTextContent("Błąd");
    });
  });

  describe("when a photo is set", () => {
    const photo = createPhoto({
      photo: { url: "blob:1", focalX: 20, focalY: 70 },
    });

    it("shows the focal point picker instead of the upload target", () => {
      render(<PhotoField photo={photo} />);
      expect(
        screen.getByRole("img", { name: "Wybrane zdjęcie" }),
      ).toBeVisible();
      expect(
        screen.getByRole("group", { name: /Punkt kadrowania: 20%/ }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText("Dodaj zdjęcie")).toBeNull();
    });

    it("removes the photo back to the upload target", () => {
      render(<PhotoField photo={photo} />);
      fireEvent.click(screen.getByRole("button", { name: "Usuń zdjęcie" }));
      expect(photo.remove).toHaveBeenCalled();
    });
  });
});
