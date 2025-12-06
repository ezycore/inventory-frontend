interface PageHeaderProps {
 title: string;
 subTitle?: string;
 titleClass?: string;
 subTitleClass?: string;
}

const PageHeader = ({title, subTitle, titleClass, subTitleClass}: PageHeaderProps) => {
 return <div>
  <h1 className={`text-3xl font-bold ${titleClass}`}>{title}</h1>
  <p className={`text-muted-foreground mt-1 ${subTitleClass}`}>
   {subTitle}
  </p>
 </div>
}

export default PageHeader;