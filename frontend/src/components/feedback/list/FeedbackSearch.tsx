import { PostOrderEnumDto, PostSortEnumDto, SearchTypeEnumDto } from '@generated/model';
import { Search } from 'lucide-react';

export default function FeedbackSearch({
  searchKeyword,
  setSearchKeyword,
  searchType,
  setSearchType,
  currentSort,
  changeSort,
  currentOrder,
  changeOrder,
  handleSearch,
  currentKeyword,
  resetSearch,
  totalElements,
}: {
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  searchType: SearchTypeEnumDto;
  setSearchType: (type: SearchTypeEnumDto) => void;
  currentSort: PostSortEnumDto;
  changeSort: (sort: PostSortEnumDto) => void;
  currentOrder: PostOrderEnumDto;
  changeOrder: (order: PostOrderEnumDto) => void;
  handleSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  currentKeyword: string;
  resetSearch: () => void;
  totalElements: number;
}) {
  return (
    <div>
      <div className='sm:w-auto sm:flex-row sm:items-center flex flex-col gap-3'>
        {/* 검색 폼 */}
        <form
          onSubmit={handleSearch}
          className='flex items-center gap-2'
        >
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as SearchTypeEnumDto)}
            className='py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 px-3 text-sm border border-gray-300 rounded-md shadow-sm'
          >
            <option value={SearchTypeEnumDto.TITLE}>제목</option>
            <option value={SearchTypeEnumDto.CONTENT}>내용</option>
            <option value={SearchTypeEnumDto.TITLE_CONTENT}>제목+내용</option>
          </select>
          <div className='relative'>
            <input
              type='text'
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder='검색어 입력...'
              className='py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-64 w-full pl-3 pr-10 text-sm border border-gray-300 rounded-md shadow-sm'
            />
            <button
              type='submit'
              className='right-2 top-1/2 hover:text-gray-600 absolute text-gray-400 -translate-y-1/2'
            >
              <Search className='w-4 h-4' />
            </button>
          </div>
        </form>

        {/* 정렬 옵션 */}
        <div className='flex items-center gap-2'>
          <select
            value={currentSort}
            onChange={(e) => changeSort(e.target.value as PostSortEnumDto)}
            className='py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 px-3 text-sm border border-gray-300 rounded-md shadow-sm'
          >
            <option value={PostSortEnumDto.CREATED_AT}>최신순</option>
            <option value={PostSortEnumDto.VIEW_COUNT}>조회순</option>
            <option value={PostSortEnumDto.LIKE_COUNT}>인기순</option>
          </select>
          <select
            value={currentOrder}
            onChange={(e) => changeOrder(e.target.value as PostOrderEnumDto)}
            className='py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 px-3 text-sm border border-gray-300 rounded-md shadow-sm'
          >
            <option value={PostOrderEnumDto.DESC}>내림차순</option>
            <option value={PostOrderEnumDto.ASC}>오름차순</option>
          </select>
        </div>
      </div>

      {/* 검색 결과 표시 */}
      {currentKeyword && (
        <div className='flex items-center justify-between p-3 mt-4 bg-gray-100 rounded-md'>
          <p className='text-gray-700'>
            <span className='font-medium'>&quot;{currentKeyword}&quot;</span>에 대한 검색 결과 ({totalElements}
            건)
          </p>
          <button
            onClick={resetSearch}
            className='hover:bg-gray-200 hover:text-gray-700 px-2 py-1 text-sm text-gray-500 rounded'
          >
            검색 초기화
          </button>
        </div>
      )}
    </div>
  );
}
