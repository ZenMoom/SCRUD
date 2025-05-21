import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ko'); // 한국어 locale
dayjs.tz.setDefault('Asia/Seoul'); // 서울 시간대 기본 설정

export default dayjs;

export const formatToKST = (utcString: string) => {
  return dayjs.utc(utcString).add(9, 'hour').format('YYYY-MM-DD HH:mm:ss');
};
