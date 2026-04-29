import { useState, useEffect } from "react";
import { ResponsiveBar } from "@nivo/bar";
import "./App.css";

interface ApiResponse {
  message: string;
}

interface SegmentRow {
  month: string;
  Champions: number;
  Active: number;
  "Low Engagement": number;
}

interface ChartData {
  data: SegmentRow[];
  title: string;
  x_title: string;
  y_title: string;
}

function App() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/hello").then((response) => response.json()),
      fetch("/api/data").then((response) => response.json()),
    ])
      .then(([helloData, dataResponse]) => {
        setApiData(helloData);
        setChartData(dataResponse);
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
                <ResponsiveBar
                  data={chartData.data}
                  keys={["Champions", "Active", "Low Engagement"]}
                  indexBy="month"
                  margin={{ top: 20, right: 130, bottom: 60, left: 60 }}
                  padding={0.3}
                  groupMode="grouped"
                  colors={["#22c55e", "#3b82f6", "#f97316"]}
                  borderRadius={3}
                  axisBottom={{
                    tickSize: 0,
                    tickPadding: 10,
                    legend: chartData.x_title,
                    legendOffset: 40,
                    legendPosition: "middle",
                  }}
                  axisLeft={{
                    tickSize: 0,
                    tickPadding: 10,
                    legend: chartData.y_title,
                    legendOffset: -50,
                    legendPosition: "middle",
                  }}
                  legends={[
                    {
                      dataFrom: "keys",
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
                  animate={true}
                  motionConfig="gentle"
                />
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;