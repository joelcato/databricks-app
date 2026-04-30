import { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import "./App.css";

interface MonthRow {
  month: string;
  order_count: number;
  total_spend: number;
  unique_customers: number;
}

interface ChartData {
  data: MonthRow[];
  title: string;
  x_title: string;
  y_title: string;
}

interface SankeyNode {
  id: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

function App() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/data").then((r) => r.json()),
      fetch("/api/sankey").then((r) => r.json()),
    ])
      .then(([dataResponse, sankeyResponse]) => {
        setChartData(dataResponse);
        setSankeyData(sankeyResponse);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false);
      });
  }, []);

  const lineOption = chartData
    ? {
        tooltip: { trigger: "axis" as const },
        legend: {
          data: ["Total Spend", "Order Count"],
          textStyle: { fontSize: 11 },
          bottom: 0,
        },
        grid: { left: 60, right: 20, top: 30, bottom: 80 },
        xAxis: {
          type: "category" as const,
          data: chartData.data.map((d) => d.month),
          axisLabel: { rotate: 45, fontSize: 10 },
        },
        yAxis: { type: "value" as const },
        series: [
          {
            name: "Total Spend",
            type: "line" as const,
            data: chartData.data.map((d) => d.total_spend),
            areaStyle: { opacity: 0.07 },
            color: "#3b82f6",
            smooth: true,
          },
          {
            name: "Order Count",
            type: "line" as const,
            data: chartData.data.map((d) => d.order_count),
            areaStyle: { opacity: 0.07 },
            color: "#22c55e",
            smooth: true,
          },
        ],
      }
    : null;

  const sankeyOption = sankeyData
    ? {
        tooltip: { trigger: "item" as const },
        series: [
          {
            type: "sankey" as const,
            data: sankeyData.nodes.map((n) => ({ name: n.id })),
            links: sankeyData.links,
            emphasis: { focus: "adjacency" as const },
            lineStyle: { color: "gradient" as const, curveness: 0.5 },
            itemStyle: { borderWidth: 0 },
            label: { fontSize: 11 },
          },
        ],
      }
    : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-800">
        <h1 className="text-3xl font-bold text-white mb-4">Customer 360</h1>
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-800 overflow-hidden">
      <h1 className="text-3xl font-bold text-white text-center py-4">
        Customer 360
      </h1>
      <div className="flex-1 grid grid-cols-1 grid-rows-2 gap-4 px-4 pb-4 min-h-0">
        {lineOption && (
          <div className="bg-white rounded-xl p-3 shadow-md flex flex-col min-h-0 overflow-hidden w-full max-w-4xl mx-auto max-h-[45vh]">
            <h2 className="text-sm font-semibold text-gray-700 text-center mb-2">
              Monthly Purchase Activity
            </h2>
            <div className="chart-wrapper flex-1 min-h-0">
              <ReactECharts
                option={lineOption}
                style={{ width: "100%", height: "100%" }}
                opts={{ renderer: "canvas" }}
              />
            </div>
          </div>
        )}

        {sankeyOption && (
          <div className="bg-white rounded-xl p-3 shadow-md flex flex-col min-h-0 overflow-hidden w-full max-w-4xl mx-auto max-h-[45vh]">
            <h2 className="text-sm font-semibold text-gray-700 text-center mb-2">
              Segment Flow: Nov → Dec 2021
            </h2>
            <div className="chart-wrapper flex-1 min-h-0">
              <ReactECharts
                option={sankeyOption}
                style={{ width: "100%", height: "100%" }}
                opts={{ renderer: "canvas" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;