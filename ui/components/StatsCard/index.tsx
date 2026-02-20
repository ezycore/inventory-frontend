interface StatsCardProps {
 data: {
  label: string;
  value: number;
  labelColor: string;
  color: string;
  bg: string;
 }[];
 isLoading?: boolean;
}


const StatsCard = ({data, isLoading} : StatsCardProps) => {
 if(!data || typeof isLoading !== "boolean") return null;
 return (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${data.length} gap-4`}>
    {data.map((stat) => (
  <div key={stat.label} className="flex flex-col gap-1 p-4 card border border-gray-200 rounded-lg" style={{backgroundColor: stat.bg}}>
    {isLoading ? (
      <>
        <div className="h-3 w-1/2 bg-gray-200 rounded"/>
        <div className="h-8 w-3/4 bg-gray-200 rounded mt-1"/>
      </>
    ) : (
      <>
        <span className="text-xs muted-foreground font-medium uppercase tracking-wide" style={{color: stat.labelColor}}>{stat.label}</span>
        <span className="text-2xl font-bold secondary-foreground" style={{color: stat.color}}>{stat.value}</span>
      </>
    )}
  </div>
))}
  </div>
 );
}

export default StatsCard;