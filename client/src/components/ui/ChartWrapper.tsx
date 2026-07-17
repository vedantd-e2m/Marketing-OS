import React from "react";
import ReactECharts from "echarts-for-react";

interface ChartWrapperProps {
  option: any;
  height?: string;
  className?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  option,
  height = "350px",
  className = "",
}) => {
  // Simple check for dark mode in HTML classes
  const isDark = document.documentElement.classList.contains("dark");

  // Modify background and grid options to blend with dashboard
  const themedOption = {
    backgroundColor: "transparent",
    textStyle: {
      fontFamily: "Inter, sans-serif",
    },
    ...option,
  };

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ReactECharts
        option={themedOption}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "canvas" }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};
