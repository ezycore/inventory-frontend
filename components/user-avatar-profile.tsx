import { Avatar, AvatarFallback, AvatarImage } from '@ui/components/avatar';

interface UserAvatarProfileProps {
  className?: string;
  showInfo?: boolean;
  user: {
    imageUrl?: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
}

export function UserAvatarProfile({
  className,
  showInfo = false,
  user
}: UserAvatarProfileProps) {
  return (
    <div className='flex items-center gap-2'>
      <Avatar className={className}>
        <AvatarImage src={user?.imageUrl || ''} alt={`${user?.firstName || ''} ${user?.lastName || ''}`} />
        <AvatarFallback className='rounded-lg'>
          {`${user?.firstName?.slice(0, 1) || ''}${user?.lastName?.slice(0, 1) || ''}`.toUpperCase() || 'CN'}
        </AvatarFallback>
      </Avatar>

      {showInfo && (
        <div className='grid flex-1 text-left text-sm leading-tight'>
          <span className='truncate font-semibold'>{`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || ''}</span>
          <span className='truncate text-xs'>
            {user?.email || 'test'}
          </span>
        </div>
      )}
    </div>
  );
}
