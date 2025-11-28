import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import Animated, { useAnimatedProps, withSpring } from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface IconProps {
  size?: number;
  color?: string;
  filled?: boolean;
  strokeWidth?: number;
}

// ==============================================
// HOME ICON — Домик с окном
// ==============================================
export const HomeIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {filled ? (
      <>
        <Path
          d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
          fill={color}
        />
        <Rect x="9" y="13" width="6" height="8" rx="1" fill="#0A0A0A" />
      </>
    ) : (
      <>
        <Path
          d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 21V13H15V21"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    )}
  </Svg>
);

// ==============================================
// SEARCH ICON — Лупа
// ==============================================
export const SearchIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
  filled = false,
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="11"
      cy="11"
      r="7"
      stroke={color}
      strokeWidth={strokeWidth}
      fill={filled ? color : 'none'}
    />
    <Path
      d="M16 16L21 21"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

// ==============================================
// CREATE/ADD ICON — Плюс в рамке
// ==============================================
export const CreateIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="4"
      stroke={color}
      strokeWidth={1.8}
    />
    <Path
      d="M12 8V16M8 12H16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// ==============================================
// BOOKMARK ICON — Закладка (для Сохранённого)
// ==============================================
export const BookmarkIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21L12 17L5 21V5Z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ==============================================
// HEART ICON — Сердце (для лайков)
// ==============================================
export const HeartIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={1.8}
    />
  </Svg>
);

// ==============================================
// COMMENT ICON — Облачко сообщения
// ==============================================
export const CommentIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 11.5C21 16.1944 16.9706 20 12 20C10.8053 20 9.66151 19.7937 8.6068 19.418L3 21L4.5 16.5C3.55055 15.0477 3 13.3296 3 11.5C3 6.80558 7.02944 3 12 3C16.9706 3 21 6.80558 21 11.5Z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {!filled && (
      <>
        <Circle cx="8" cy="11.5" r="1" fill={color} />
        <Circle cx="12" cy="11.5" r="1" fill={color} />
        <Circle cx="16" cy="11.5" r="1" fill={color} />
      </>
    )}
  </Svg>
);

// ==============================================
// SHARE ICON — Стрелка поделиться
// ==============================================
export const ShareIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L12 15M12 3L8 7M12 3L16 7"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4 14V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V14"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

// ==============================================
// MESSAGE ICON — Конверт/письмо
// ==============================================
export const MessageIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={1.8}
    />
    <Path
      d="M3 7L12 13L21 7"
      stroke={filled ? '#0A0A0A' : color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ==============================================
// MUTE/UNMUTE ICONS — Динамик
// ==============================================
export const VolumeIcon: React.FC<IconProps & { muted?: boolean }> = ({ 
  size = 24, 
  color = '#FFFFFF',
  muted = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 5L6 9H2V15H6L11 19V5Z"
      fill={color}
    />
    {!muted ? (
      <>
        <Path
          d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <Path
          d="M18.07 5.93C19.9447 7.80528 20.9979 10.3478 20.9979 13C20.9979 15.6522 19.9447 18.1947 18.07 20.07"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </>
    ) : (
      <Path
        d="M16 9L22 15M22 9L16 15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    )}
  </Svg>
);

// ==============================================
// PROFILE ICON — Человек
// ==============================================
export const ProfileIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="8"
      r="4"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={1.8}
    />
    <Path
      d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

// ==============================================
// CAR ICON — Для категории Авто
// ==============================================
export const CarIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 11L6.5 6.5C6.8 5.6 7.6 5 8.5 5H15.5C16.4 5 17.2 5.6 17.5 6.5L19 11"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Rect
      x="3"
      y="11"
      width="18"
      height="7"
      rx="2"
      stroke={color}
      strokeWidth={1.8}
    />
    <Circle cx="7" cy="15" r="1.5" fill={color} />
    <Circle cx="17" cy="15" r="1.5" fill={color} />
  </Svg>
);

// ==============================================
// HORSE ICON — Для категории Лошади
// ==============================================
export const HorseIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 4L20 2M20 2L22 4M20 2V6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 6C16 6 14 4 10 4C6 4 4 8 4 12C4 16 6 20 8 20"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Path
      d="M16 6C18 6 20 8 20 10C20 12 18 14 16 14L12 20"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Circle cx="14" cy="9" r="1" fill={color} />
  </Svg>
);

// ==============================================
// HOUSE ICON — Для категории Недвижимость
// ==============================================
export const HouseIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21V15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V21M9 21H15"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ==============================================
// SEND ICON — Отправить
// ==============================================
export const SendIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ==============================================
// CLOSE ICON — Закрыть
// ==============================================
export const CloseIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Export all icons
export const Icons = {
  Home: HomeIcon,
  Search: SearchIcon,
  Create: CreateIcon,
  Bookmark: BookmarkIcon,
  Heart: HeartIcon,
  Comment: CommentIcon,
  Share: ShareIcon,
  Message: MessageIcon,
  Volume: VolumeIcon,
  Profile: ProfileIcon,
  Car: CarIcon,
  Horse: HorseIcon,
  House: HouseIcon,
  Send: SendIcon,
  Close: CloseIcon,
};

