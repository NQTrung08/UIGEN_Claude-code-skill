import { forwardRef, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useChat } from "@/lib/contexts/chat-context";

let renderViewport = true;

vi.mock("@/lib/contexts/chat-context", () => ({
  useChat: vi.fn(),
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
    ({ children, className }, ref) => (
      <div ref={ref} className={className} data-testid="scroll-area">
        {renderViewport ? (
          <div data-testid="scroll-viewport" data-radix-scroll-area-viewport>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    )
  ),
}));

vi.mock("@/components/chat/MessageList", () => ({
  MessageList: ({ messages, isLoading }: { messages: Array<{ id?: string }>; isLoading: boolean }) => (
    <div data-testid="message-list" data-loading={String(isLoading)}>
      {messages.length} messages
    </div>
  ),
}));

vi.mock("@/components/chat/MessageInput", () => ({
  MessageInput: ({
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  }: {
    input: string;
    handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
  }) => (
    <form onSubmit={handleSubmit} data-testid="message-input">
      <textarea
        aria-label="message input"
        value={input}
        onChange={handleInputChange}
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        Submit
      </button>
    </form>
  ),
}));

function createChatValue(overrides: Partial<ReturnType<typeof baseChatValue>> = {}) {
  return {
    ...baseChatValue(),
    ...overrides,
  };
}

function baseChatValue() {
  return {
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn((event) => event.preventDefault()),
    status: "idle",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  renderViewport = true;
  vi.mocked(useChat).mockReturnValue(createChatValue());
});

afterEach(() => {
  cleanup();
});

describe("ChatInterface", () => {
  it("renders the message list and input with the current chat state", () => {
    vi.mocked(useChat).mockReturnValue(
      createChatValue({
        messages: [{ id: "1", role: "user", content: "Hello" }],
        input: "Build a button",
      })
    );

    render(<ChatInterface />);

    expect(screen.getByTestId("message-list").textContent).toContain("1 messages");
    expect(screen.getByLabelText("message input")).toHaveProperty("value", "Build a button");
  });

  it("passes loading=true to child components while streaming", () => {
    vi.mocked(useChat).mockReturnValue(
      createChatValue({
        messages: [
          { id: "1", role: "user", content: "Hello" },
          { id: "2", role: "assistant", content: "Hi" },
        ],
        status: "streaming",
      })
    );

    render(<ChatInterface />);

    expect(screen.getByTestId("message-list").getAttribute("data-loading")).toBe("true");
    expect(screen.getByLabelText("message input")).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Submit" })).toHaveProperty("disabled", true);
  });

  it.each(["idle", "ready", "error"]) (
    "keeps the input enabled when status is %s",
    (status) => {
      vi.mocked(useChat).mockReturnValue(
        createChatValue({
          input: "Draft a card",
          status,
        })
      );

      render(<ChatInterface />);

      expect(screen.getByTestId("message-list").getAttribute("data-loading")).toBe("false");
      expect(screen.getByLabelText("message input")).toHaveProperty("disabled", false);
      expect(screen.getByRole("button", { name: "Submit" })).toHaveProperty("disabled", false);
    }
  );

  it.each(["submitted", "streaming"]) (
    "disables the input and submit button when status is %s",
    (status) => {
      vi.mocked(useChat).mockReturnValue(createChatValue({ status }));

      render(<ChatInterface />);

      expect(screen.getByLabelText("message input")).toHaveProperty("disabled", true);
      expect(screen.getByRole("button", { name: "Submit" })).toHaveProperty("disabled", true);
    }
  );

  it("forwards input and submit interactions to the handlers from useChat", async () => {
    const user = userEvent.setup();
    const handleInputChange = vi.fn();
    const handleSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) =>
      event.preventDefault()
    );

    vi.mocked(useChat).mockReturnValue(
      createChatValue({
        handleInputChange,
        handleSubmit,
      })
    );

    render(<ChatInterface />);

    await user.type(screen.getByLabelText("message input"), "abc");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(handleInputChange).toHaveBeenCalledTimes(3);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("scrolls the viewport to the bottom when the message list changes", () => {
    const { rerender } = render(<ChatInterface />);
    const viewport = screen.getByTestId("scroll-viewport");

    Object.defineProperty(viewport, "scrollHeight", {
      configurable: true,
      value: 240,
    });
    viewport.scrollTop = 0;

    vi.mocked(useChat).mockReturnValue(
      createChatValue({
        messages: [{ id: "1", role: "user", content: "New message" }],
      })
    );

    rerender(<ChatInterface />);

    expect(viewport.scrollTop).toBe(240);
  });

  it("does not crash when the scroll viewport is missing", () => {
    renderViewport = false;

    expect(() => render(<ChatInterface />)).not.toThrow();
    expect(screen.getByTestId("message-list")).toBeDefined();
  });

  it("surfaces errors from useChat", () => {
    vi.mocked(useChat).mockImplementation(() => {
      throw new Error("Chat context unavailable");
    });

    expect(() => render(<ChatInterface />)).toThrow("Chat context unavailable");
  });

  it("renders the expected layout wrappers", () => {
    const { container } = render(<ChatInterface />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("flex");
    expect(root.className).toContain("flex-col");
    expect(root.className).toContain("h-full");
    expect(root.className).toContain("p-4");
    expect(root.className).toContain("overflow-hidden");

    const scrollArea = screen.getByTestId("scroll-area");
    expect(scrollArea.className).toContain("flex-1");
    expect(scrollArea.className).toContain("overflow-hidden");

    const inputWrapper = screen.getByTestId("message-input").parentElement as HTMLElement;
    expect(inputWrapper.className).toContain("mt-4");
    expect(inputWrapper.className).toContain("flex-shrink-0");
  });
});
