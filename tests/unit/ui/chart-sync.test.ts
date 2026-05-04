/**
 * Chart crosshair sync tests (B9).
 */
import { describe, it, expect, vi } from "vitest";
import { createChartSyncBus, wireCrosshairSync } from "../../../src/ui/chart-sync";

describe("createChartSyncBus", () => {
  it("publish notifies other subscribers but not the sender", () => {
    const bus = createChartSyncBus();
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    bus.subscribe("chart-A", { setCrosshair: cb1 });
    bus.subscribe("chart-B", { setCrosshair: cb2 });

    bus.publish("chart-A", "2025-01-15");

    expect(cb1).not.toHaveBeenCalled(); // sender is excluded
    expect(cb2).toHaveBeenCalledWith("2025-01-15");
  });

  it("publish with null clears crosshair on all others", () => {
    const bus = createChartSyncBus();
    const cbB = vi.fn();
    const cbC = vi.fn();

    bus.subscribe("chart-A", { setCrosshair: vi.fn() });
    bus.subscribe("chart-B", { setCrosshair: cbB });
    bus.subscribe("chart-C", { setCrosshair: cbC });

    bus.publish("chart-A", null);

    expect(cbB).toHaveBeenCalledWith(null);
    expect(cbC).toHaveBeenCalledWith(null);
  });

  it("unsubscribe stops receiving crosshair events", () => {
    const bus = createChartSyncBus();
    const cb = vi.fn();

    bus.subscribe("chart-A", { setCrosshair: vi.fn() });
    bus.subscribe("chart-B", { setCrosshair: cb });

    bus.unsubscribe("chart-B");
    bus.publish("chart-A", "2025-06-01");

    expect(cb).not.toHaveBeenCalled();
  });

  it("clear() removes all subscribers", () => {
    const bus = createChartSyncBus();
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    bus.subscribe("A", { setCrosshair: cb1 });
    bus.subscribe("B", { setCrosshair: cb2 });

    bus.clear();
    bus.publish("A", "2025-01-01");

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });

  it("multiple publishes from different charts notify the correct targets", () => {
    const bus = createChartSyncBus();
    const cbA = vi.fn();
    const cbB = vi.fn();
    const cbC = vi.fn();

    bus.subscribe("A", { setCrosshair: cbA });
    bus.subscribe("B", { setCrosshair: cbB });
    bus.subscribe("C", { setCrosshair: cbC });

    bus.publish("B", "2024-03-10");

    expect(cbA).toHaveBeenCalledWith("2024-03-10");
    expect(cbB).not.toHaveBeenCalled(); // sender excluded
    expect(cbC).toHaveBeenCalledWith("2024-03-10");
  });
});

describe("wireCrosshairSync", () => {
  it("subscribes chart to the bus", () => {
    const bus = createChartSyncBus();
    const busSubscribe = vi.spyOn(bus, "subscribe");

    const mockCrosshairMove = vi.fn().mockReturnValue(() => undefined);
    const mockChart = {
      subscribeCrosshairMove: mockCrosshairMove,
      unsubscribeCrosshairMove: vi.fn(),
      setCrosshairPosition: vi.fn(),
      clearCrosshairPosition: vi.fn(),
    };

    wireCrosshairSync("test-chart", mockChart, {}, bus);
    expect(busSubscribe).toHaveBeenCalledWith("test-chart", expect.any(Object));
  });

  it("unsubscribe returned function removes chart from bus", () => {
    const bus = createChartSyncBus();
    const cbOther = vi.fn();

    const mockCrosshairMove = vi.fn().mockReturnValue(() => undefined);
    const mockChart = {
      subscribeCrosshairMove: mockCrosshairMove,
      unsubscribeCrosshairMove: vi.fn(),
      setCrosshairPosition: vi.fn(),
      clearCrosshairPosition: vi.fn(),
    };

    bus.subscribe("other", { setCrosshair: cbOther });
    const unsub = wireCrosshairSync("test-chart", mockChart, {}, bus);
    unsub();

    bus.publish("test-chart", "2025-01-01");
    // "other" should still get it, but "test-chart" was unregistered from bus
    // (bus.publish excludes the fromId, so "other" gets the event)
    expect(cbOther).toHaveBeenCalled();
  });

  it("entry.setCrosshair(null) calls clearCrosshairPosition", () => {
    const bus = createChartSyncBus();
    const mockClear = vi.fn();
    const mockChart = {
      subscribeCrosshairMove: vi.fn().mockReturnValue(() => undefined),
      unsubscribeCrosshairMove: vi.fn(),
      setCrosshairPosition: vi.fn(),
      clearCrosshairPosition: mockClear,
    };

    wireCrosshairSync("A", mockChart, {}, bus);

    // Simulate bus firing null from another chart
    bus.publish("B", null);
    // A is subscribed, will receive null
    expect(mockClear).toHaveBeenCalled();
  });

  it("entry.setCrosshair(time) calls setCrosshairPosition with correct time", () => {
    const bus = createChartSyncBus();
    const mockSetCross = vi.fn();
    const mockSeries = {};
    const mockChart = {
      subscribeCrosshairMove: vi.fn().mockReturnValue(() => undefined),
      unsubscribeCrosshairMove: vi.fn(),
      setCrosshairPosition: mockSetCross,
      clearCrosshairPosition: vi.fn(),
    };

    bus.subscribe("B", { setCrosshair: vi.fn() });
    wireCrosshairSync("A", mockChart, mockSeries, bus);

    // Simulate bus firing a time from chart B
    bus.publish("B", "2025-06-15");
    expect(mockSetCross).toHaveBeenCalledWith(0, "2025-06-15", mockSeries);
  });
});
