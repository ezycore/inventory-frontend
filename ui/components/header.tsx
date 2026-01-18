import { ReactNode } from "react";

interface PageHeaderProps {
 title: string;
 subTitle?: string;
 titleClass?: string;
 subTitleClass?: string;
 actions?: ReactNode;
}

const PageHeader = ({title, subTitle, titleClass, subTitleClass, actions}: PageHeaderProps) => {
 return (
  <div className="flex items-start justify-between">
   <div>
    <h1 className={`text-3xl font-bold ${titleClass}`}>{title}</h1>
    {subTitle && (
     <p className={`text-muted-foreground mt-1 ${subTitleClass}`}>
      {subTitle}
     </p>
    )}
   </div>
   {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
 )
}

export default PageHeader;