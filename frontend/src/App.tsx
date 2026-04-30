import { useState, useEffect } from "react";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveSankey } from "@nivo/sankey";
import "./App.css";

interface ApiResponse {
  message: string;
}

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
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/hello").then((r) => r.json()),
      fetch("/api/data").then((r) => r.json()),
      fetch("/api/sankey").then((r) => r.json()),
    ])
      .then(([helloData, dataResponse, sankeyResponse]) => {
        setApiData(helloData);
        setChartData(dataResponse);
        setSankeyData(sankeyResponse);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Customer 360</h1>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="content">
            {apiData && (
              <div className="api-info">
                <p className="message">{apiData.message}</p>
              </div>
            )}

            {chartData && (
              <div className="chart-container">
                <h2 style={{ textAlign: "center", color: "#333", margin: "0 0 12px 0" }}>
                  {chartData.title}
                </h2>
                <div className="chart-wrapper">
                  <ResponsiveLine
                    data={[
                      {
                        id: "Total Spend",
                        data: chartData.data.map((d) => ({
                          x: d.month,
                          y: d.total_spend,
                        })),
                      },
                      {
                        id: "Order Count",
                        data: chartData.data.map((d) => ({
                          x: d.month,
                          y: d.order_count,
                        })),
                      },
                    ]}
                    margin={{ top: 20, right: 130, bottom: 70, left: 80 }}
                    xScale={{ type: "point" }}
                    yScale={{ type: "linear", stacked: false }}
                    axisBottom={{
                      tickRotation: -45,
                      legend: chartData.x_title,
                      legendOffset: 60,
                      legendPosition: "middle",
                    }}
                    axisLeft={{
                      legend: chartData.y_title,
                      legendOffset: -65,
                      legendPosition: "middle",
                    }}
                    colors={["#3b82f6", "#22c55e"]}
                    pointSize={4}
                    pointColor={{ from: "color" }}
                    enableArea={true}
                    areaOpacity={0.07}
                    useMesh={true}
                    animate={true}
                    motionConfig="gentle"
                    legends={[
                      {
                        anchor: "bottom-right",
                        direction: "column",
                        translateX: 120,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemTextColor: "#666",
                        symbolSize: 12,
                        symbolShape: "circle",
                      },
                    ]}
                  />
                </div>
              </div>
            )}

            {sankeyData && (
              <div className="chart-container">
                <h2 style={{ textAlign: "center", color: "#333", margin: "0 0 12px 0" }}>
                  Customer Segment Flow: Nov → Dec 2021
                </h2>
                <div className="chart-wrapper">
                  <ResponsiveSankey
                    data={sankeyData}
                    margin={{ top: 20, right: 160, bottom: 20, left: 20 }}
                    align="justify"
                    colors={["#22c55e", "#3b82f6", "#f97316"]}
                    nodeOpacity={1}
                    nodeThickness={18}
                    nodeInnerPadding={3}
                    nodeSpacing={24}
                    nodeBorderWidth={0}
                    linkOpacity={0.3}
                    linkHoverOpacity={0.6}
                    linkContract={3}
                    enableLinkGradient={true}
                    labelPosition="outside"
                    labelOrientation="horizontal"
                    labelPadding={16}
                    labelTextColor={{ from: "color", modifiers: [["darker", 1]] }}
                    animate={true}
                    motionConfig="gentle"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;