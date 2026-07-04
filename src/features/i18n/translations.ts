export type Language = "en" | "zh-TW";

export interface TourCopy {
  menuLabel: string;
  openMenu: string;
  menuAria: string;
  catalog: Record<"quickStart" | "newFeatures" | "timeline" | "output", { label: string; description: string }>;
  steps: Record<string, { title: string; content: string }>;
  controls: Record<"back" | "close" | "collapse" | "done" | "expand" | "next" | "open" | "skip", string>;
  complete: string;
  keepTitle: string;
  keepDescription: string;
  restore: string;
  keep: string;
}

export interface Translation {
  app: { title: string; subtitle: string; pageTitle: string };
  language: { open: string; menu: string };
  theme: { light: string; dark: string };
  legend: string;
  sections: Record<"context" | "base" | "timeline" | "selectedChange" | "output", { title: string; description: string }>;
  fields: { station: string; stationPlaceholder: string; issueTime: string };
  conditions: {
    edit: string; wind: string; windDirection: string; windSpeed: string; windGust: string;
    visibilityWeather: string; visibility: string; weather: string; maximum: (value: string) => string; weatherSummary: (value: string) => string;
    clouds: string; hundredsFeet: string; addLayer: string;
    activateWind: string; activateVisibility: string; activateClouds: string; includeInChange: string;
    deactivateWind: string; deactivateVisibility: string; deactivateClouds: string;
    activateWindAria: string; activateVisibilityAria: string; activateCloudsAria: string;
    addWeather: (value: string) => string; removeWeather: (value: string) => string; space: string;
    visibilityError: string;
  };
  output: { station: string; validity: string; base: string; configured: string; changes: string; blocks: (count: number) => string; note: string; live: string };
  actions: { increase: string; decrease: string; selectHour: (hour: string) => string; deleteChange: string; deleteCloud: string; deleteLayer: string; changeType: string; switchType: (type: string) => string };
  tour: TourCopy;
}

export const en: Translation = {
  app: { title: "TAF Visual Builder", subtitle: "Aviation Weather Workbench", pageTitle: "Create Terminal Aerodrome Forecast" },
  language: { open: "Choose language", menu: "Languages" },
  theme: { light: "Switch to light mode", dark: "Switch to dark mode" },
  legend: "Change type legend",
  sections: {
    context: { title: "Forecast context", description: "Identify the aerodrome and forecast issue time." },
    base: { title: "Base forecast", description: "Set prevailing conditions for the full validity period." },
    timeline: { title: "Forecast timeline", description: "Select a start and end hour to create a change block." },
    selectedChange: { title: "Selected change", description: "Fine-tune the conditions that change in this period." },
    output: { title: "Generated TAF", description: "Updates live as conditions change." },
  },
  fields: { station: "ICAO station code", stationPlaceholder: "ICAO Code", issueTime: "Issue time · DDHHMM" },
  conditions: {
    edit: "Edit", wind: "Wind", windDirection: "Wind Direction", windSpeed: "Wind Speed", windGust: "Wind Gust",
    visibilityWeather: "Visibility & weather", visibility: "Visibility", weather: "Weather", maximum: (value) => `Maximum ${value} m`, weatherSummary: (value) => `Weather: ${value}`,
    clouds: "Cloud layers", hundredsFeet: "hundreds ft", addLayer: "Add Layer",
    activateWind: "Activate wind", activateVisibility: "Activate visibility & weather", activateClouds: "Activate cloud layers", includeInChange: "Include this section in the change",
    deactivateWind: "Deactivate wind", deactivateVisibility: "Deactivate visibility and weather", deactivateClouds: "Deactivate clouds",
    activateWindAria: "Activate wind to edit", activateVisibilityAria: "Activate visibility and weather to edit", activateCloudsAria: "Activate clouds to edit",
    addWeather: (value) => `Add ${value}`, removeWeather: (value) => `Remove ${value}`, space: "space",
    visibilityError: "Visibility 5000m Or Below, Weather Must Be Selected",
  },
  output: {
    station: "STATION", validity: "VALIDITY", base: "BASE", configured: "Configured", changes: "CHANGES",
    blocks: (count) => `${count} ${count === 1 ? "block" : "blocks"}`,
    note: "The generated message remains visible while editing, reducing context switching and making cause-and-effect easier to verify.", live: "Live",
  },
  actions: {
    increase: "Increase value", decrease: "Decrease value", selectHour: (hour) => `Select ${hour}Z`,
    deleteChange: "Delete change", deleteCloud: "Delete cloud layer", deleteLayer: "Delete Layer", changeType: "Change type", switchType: (type) => `Switch to ${type}`,
  },
  tour: {
    menuLabel: "Guided briefing", openMenu: "Open guided tours", menuAria: "Guided tours",
    catalog: {
      quickStart: { label: "Quick Start", description: "Learn the complete forecast workflow." },
      newFeatures: { label: "New Features", description: "Review the new workbench workflow." },
      timeline: { label: "Timeline Help", description: "Learn how change periods work." },
      output: { label: "Generated TAF Help", description: "Understand the live output." },
    },
    steps: {
      context: { title: "Forecast context", content: "Enter the ICAO station and issue time." },
      base: { title: "Base forecast", content: "Set the prevailing conditions for the full validity period." },
      wind: { title: "Wind", content: "Set direction, speed, and gust." },
      visibility: { title: "Visibility & weather", content: "Set visibility and select weather phenomena." },
      clouds: { title: "Cloud layers", content: "Choose cloud amount and height." },
      createChange: { title: "Create a change period", content: "Use the timeline to create and review change periods." },
      selectedChange: { title: "Selected change", content: "Fine-tune only the conditions that change in this period." },
      changeType: { title: "Change type", content: "Switch between TEMPO, BECMG, and FM." },
      output: { title: "Generated TAF", content: "The final TAF updates live as you edit." },
    },
    controls: { back: "Back", close: "Close", collapse: "Collapse guided tour", done: "Done", expand: "Expand guided tour", next: "Next", open: "Open guided step", skip: "Skip" },
    complete: "Guided briefing complete", keepTitle: "Keep the demonstration forecast?", keepDescription: "You can keep the example values or restore the forecast you had before starting.", restore: "Restore my forecast", keep: "Keep demo result",
  },
};

export const zhTW: Translation = {
  app: { title: "TAF 視覺化編輯器", subtitle: "航空氣象工作台", pageTitle: "建立機場終端預報" },
  language: { open: "選擇語言", menu: "語言" },
  theme: { light: "切換至淺色模式", dark: "切換至深色模式" },
  legend: "變化類型圖例",
  sections: {
    context: { title: "預報基本資料", description: "設定機場與預報發布時間。" },
    base: { title: "基本預報", description: "設定整個有效期間的主要天氣狀況。" },
    timeline: { title: "預報時間軸", description: "選擇開始與結束時間以建立變化區段。" },
    selectedChange: { title: "選取的變化區段", description: "微調此期間內發生變化的天氣狀況。" },
    output: { title: "產生的 TAF", description: "天氣狀況變更時即時更新。" },
  },
  fields: { station: "ICAO 機場代碼", stationPlaceholder: "ICAO 代碼", issueTime: "發布時間 · DDHHMM" },
  conditions: {
    edit: "編輯", wind: "風", windDirection: "風向", windSpeed: "風速", windGust: "陣風",
    visibilityWeather: "能見度與天氣現象", visibility: "能見度", weather: "天氣現象", maximum: (value) => `最大 ${value} 公尺`, weatherSummary: (value) => `天氣：${value}`,
    clouds: "雲層", hundredsFeet: "百呎", addLayer: "新增雲層",
    activateWind: "啟用風況", activateVisibility: "啟用能見度與天氣現象", activateClouds: "啟用雲層", includeInChange: "將此區段納入變化內容",
    deactivateWind: "停用風況", deactivateVisibility: "停用能見度與天氣現象", deactivateClouds: "停用雲層",
    activateWindAria: "啟用風況以進行編輯", activateVisibilityAria: "啟用能見度與天氣現象以進行編輯", activateCloudsAria: "啟用雲層以進行編輯",
    addWeather: (value) => `新增 ${value}`, removeWeather: (value) => `移除 ${value}`, space: "空格",
    visibilityError: "能見度為 5000 公尺以下時，必須選擇天氣現象",
  },
  output: {
    station: "機場", validity: "有效期間", base: "基本預報", configured: "已設定", changes: "變化區段",
    blocks: (count) => `${count} 個區段`,
    note: "編輯時會持續顯示產生的報文，減少畫面切換並方便確認設定與結果。", live: "即時",
  },
  actions: {
    increase: "增加數值", decrease: "減少數值", selectHour: (hour) => `選擇 ${hour}Z`,
    deleteChange: "刪除變化區段", deleteCloud: "刪除雲層", deleteLayer: "刪除雲層", changeType: "變更類型", switchType: (type) => `切換為 ${type}`,
  },
  tour: {
    menuLabel: "導覽說明", openMenu: "開啟導覽", menuAria: "導覽",
    catalog: {
      quickStart: { label: "快速開始", description: "了解完整的預報製作流程。" },
      newFeatures: { label: "新功能", description: "查看新版工作台操作流程。" },
      timeline: { label: "時間軸說明", description: "了解變化區段的運作方式。" },
      output: { label: "TAF 輸出說明", description: "了解即時產生的報文。" },
    },
    steps: {
      context: { title: "預報基本資料", content: "輸入 ICAO 機場代碼與發布時間。" },
      base: { title: "基本預報", content: "設定整個有效期間的主要天氣狀況。" },
      wind: { title: "風況", content: "設定風向、風速與陣風。" },
      visibility: { title: "能見度與天氣現象", content: "設定能見度並選擇天氣現象。" },
      clouds: { title: "雲層", content: "選擇雲量與雲底高度。" },
      createChange: { title: "建立變化區段", content: "使用時間軸建立並檢視變化區段。" },
      selectedChange: { title: "選取的變化區段", content: "只調整此期間內發生變化的天氣狀況。" },
      changeType: { title: "變化類型", content: "在 TEMPO、BECMG 與 FM 之間切換。" },
      output: { title: "產生的 TAF", content: "編輯時，最終 TAF 會即時更新。" },
    },
    controls: { back: "上一步", close: "關閉", collapse: "收合導覽", done: "完成", expand: "展開導覽", next: "下一步", open: "開啟導覽步驟", skip: "略過" },
    complete: "導覽完成", keepTitle: "要保留示範預報嗎？", keepDescription: "你可以保留範例數值，或還原開始導覽前的預報。", restore: "還原我的預報", keep: "保留示範結果",
  },
};

export const translations: Record<Language, Translation> = { en, "zh-TW": zhTW };
