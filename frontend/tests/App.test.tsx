import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "../src/App";

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe("App", () => {
  it("renders the sidebar with navigation links", async () => {
    renderApp();
    expect((await screen.findAllByText("Event Impact Model")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Overview")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Event Explorer")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Asset Comparison")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Regime Analysis")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Data Manager")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Methodology")).length).toBeGreaterThan(0);
  });
});
