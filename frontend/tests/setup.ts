import { createElement } from "react";
import { vi } from "vitest";

vi.mock("react-plotly.js", () => ({
  default: function PlotlyMock() {
    return createElement("div", { "data-testid": "plotly-chart" });
  },
}));
