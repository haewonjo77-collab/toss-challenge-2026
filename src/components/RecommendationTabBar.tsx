import './RecommendationTabBar.css';

interface TabOption {
  key: string;
  label: string; // 정렬 순위에서 파생된 라벨 ("추천", "대안 1", "대안 2", …)
}

interface RecommendationTabBarProps {
  options: TabOption[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function RecommendationTabBar({ options, activeKey, onSelect }: RecommendationTabBarProps) {
  return (
    <div className="recommendation-tabs" role="tablist" aria-label="추천 시간 옵션">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          role="tab"
          aria-selected={option.key === activeKey}
          className={`recommendation-tabs__tab${
            option.key === activeKey ? ' recommendation-tabs__tab--active' : ''
          }`}
          onClick={() => onSelect(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
