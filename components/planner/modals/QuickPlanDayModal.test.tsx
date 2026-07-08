"use client";

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickPlanDayModal } from "./QuickPlanDayModal";
import "@testing-library/jest-dom";

describe("QuickPlanDayModal", () => {
  const currentDate = new Date(2026, 6, 8);

  it("adds tasks on Enter and persists them on Done", () => {
    const onAddTasks = jest.fn();
    const onClose = jest.fn();

    render(
      <QuickPlanDayModal
        isOpen
        onClose={onClose}
        onAddTasks={onAddTasks}
        currentDate={currentDate}
      />
    );

    const input = screen.getByPlaceholderText("Type a task and press Enter...");
    fireEvent.change(input, { target: { value: "Review notes" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Review notes")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(onAddTasks).toHaveBeenCalledWith([
      expect.objectContaining({ name: "Review notes" }),
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not persist tasks when cancelled", () => {
    const onAddTasks = jest.fn();
    const onClose = jest.fn();

    render(
      <QuickPlanDayModal
        isOpen
        onClose={onClose}
        onAddTasks={onAddTasks}
        currentDate={currentDate}
      />
    );

    const input = screen.getByPlaceholderText("Type a task and press Enter...");
    fireEvent.change(input, { target: { value: "Draft task" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onAddTasks).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
