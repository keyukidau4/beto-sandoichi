import React, { useState } from 'react';
import {
  Layout,
  Container,
  Grid,
  Card,
  Section,
  Flex,
  Responsive,
  Spacer,
  Button,
  IconButton,
  ButtonGroup,
  Navigation,
  Breadcrumb,
  SidebarNavigation,
  TabNavigation,
  LoadingSpinner,
  PageSpinner,
  CardSpinner,
  InlineSpinner,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
} from '../common';

const ResponsiveUIDemo: React.FC = () => {
  const [activeNav, setActiveNav] = useState('home');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [showPageSpinner, setShowPageSpinner] = useState(false);

  const navigationItems = [
    {
      id: 'home',
      label: 'ホーム',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'products',
      label: '商品',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      badge: 5,
    },
    {
      id: 'orders',
      label: '注文',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  const tabs = [
    { id: 'overview', label: '概要', count: 12 },
    { id: 'details', label: '詳細', count: 8 },
    { id: 'settings', label: '設定' },
  ];

  const breadcrumbItems = [
    { label: 'ホーム', onClick: () => console.log('Navigate to home') },
    { label: 'コンポーネント', onClick: () => console.log('Navigate to components') },
    { label: 'レスポンシブUI' },
  ];

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handlePageSpinnerDemo = () => {
    setShowPageSpinner(true);
    setTimeout(() => setShowPageSpinner(false), 3000);
  };

  return (
    <>
      {showPageSpinner && <PageSpinner text="ページを読み込み中..." />}
      
      <Layout
        onNavigate={(section) => console.log(`Navigate to: ${section}`)}
        containerClass="py-8"
      >
        <Container size="xl">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} className="mb-6" />

          {/* Page Header */}
          <Section title="レスポンシブUIコンポーネント" subtitle="BanhMi Appで使用される各種UIコンポーネントのデモンストレーション">
            
            {/* Navigation Demo */}
            <Card className="mb-8">
              <h3 className="text-lg font-semibold mb-4 font-japanese">ナビゲーション</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">水平ナビゲーション (タブ)</h4>
                  <Navigation
                    items={navigationItems}
                    activeItem={activeNav}
                    onItemClick={setActiveNav}
                    variant="tabs"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">水平ナビゲーション (ピル)</h4>
                  <Navigation
                    items={navigationItems}
                    activeItem={activeNav}
                    onItemClick={setActiveNav}
                    variant="pills"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">サイドバーナビゲーション</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <SidebarNavigation
                        items={navigationItems}
                        activeItem={activeNav}
                        onItemClick={setActiveNav}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">タブナビゲーション</h4>
                    <TabNavigation
                      tabs={tabs}
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Button Demo */}
            <Card className="mb-8">
              <h3 className="text-lg font-semibold mb-4 font-japanese">ボタン</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">バリエーション</h4>
                  <Flex wrap gap="sm">
                    <Button variant="primary">プライマリ</Button>
                    <Button variant="secondary">セカンダリ</Button>
                    <Button variant="outline">アウトライン</Button>
                    <Button variant="ghost">ゴースト</Button>
                    <Button variant="danger">危険</Button>
                    <Button variant="success">成功</Button>
                  </Flex>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">サイズ</h4>
                  <Flex wrap gap="sm" align="center">
                    <Button size="xs">XS</Button>
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button size="xl">XL</Button>
                  </Flex>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">アイコン付きボタン</h4>
                  <Flex wrap gap="sm">
                    <Button
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      }
                    >
                      追加
                    </Button>
                    <Button
                      variant="outline"
                      rightIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      }
                    >
                      次へ
                    </Button>
                    <IconButton
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      }
                      aria-label="閉じる"
                    />
                  </Flex>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">ローディング状態</h4>
                  <Flex wrap gap="sm">
                    <Button loading={loading} onClick={handleLoadingDemo}>
                      {loading ? 'ローディング中...' : 'ローディングテスト'}
                    </Button>
                    <Button variant="outline" loading loadingText="処理中">
                      常にローディング
                    </Button>
                  </Flex>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">ボタングループ</h4>
                  <ButtonGroup>
                    <Button variant="outline">左</Button>
                    <Button variant="outline">中央</Button>
                    <Button variant="outline">右</Button>
                  </ButtonGroup>
                </div>
              </div>
            </Card>

            {/* Loading Demo */}
            <Card className="mb-8">
              <h3 className="text-lg font-semibold mb-4 font-japanese">ローディング</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">スピナー</h4>
                  <Flex wrap gap="lg" align="center">
                    <div className="text-center">
                      <LoadingSpinner size="sm" />
                      <p className="text-xs text-gray-500 mt-2">Small</p>
                    </div>
                    <div className="text-center">
                      <LoadingSpinner size="md" />
                      <p className="text-xs text-gray-500 mt-2">Medium</p>
                    </div>
                    <div className="text-center">
                      <LoadingSpinner size="lg" />
                      <p className="text-xs text-gray-500 mt-2">Large</p>
                    </div>
                    <div className="text-center">
                      <LoadingSpinner size="xl" />
                      <p className="text-xs text-gray-500 mt-2">XL</p>
                    </div>
                  </Flex>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">テキスト付きスピナー</h4>
                  <Flex wrap gap="lg">
                    <InlineSpinner text="読み込み中..." />
                    <LoadingSpinner text="データを取得中..." />
                  </Flex>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">フルスクリーンローディング</h4>
                  <Button onClick={handlePageSpinnerDemo}>
                    ページスピナーを表示
                  </Button>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">カードローディング</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <CardSpinner text="コンテンツを読み込み中..." />
                  </div>
                </div>
              </div>
            </Card>

            {/* Skeleton Demo */}
            <Card className="mb-8">
              <h3 className="text-lg font-semibold mb-4 font-japanese">スケルトンローディング</h3>
              
              <Grid cols={3} gap="md">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">カードスケルトン</h4>
                  <SkeletonCard />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">リストスケルトン</h4>
                  <SkeletonList items={3} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">テーブルスケルトン</h4>
                  <SkeletonTable rows={4} cols={3} />
                </div>
              </Grid>
            </Card>

            {/* Layout Demo */}
            <Card className="mb-8">
              <h3 className="text-lg font-semibold mb-4 font-japanese">レイアウト</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">グリッドレイアウト</h4>
                  <Grid cols={4} gap="md">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Card key={i} padding="sm" className="bg-primary-50 text-center">
                        <p className="text-sm">アイテム {i + 1}</p>
                      </Card>
                    ))}
                  </Grid>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">フレックスレイアウト</h4>
                  <Flex justify="between" align="center" className="bg-gray-50 p-4 rounded-lg">
                    <div className="bg-primary-100 p-3 rounded">左</div>
                    <div className="bg-secondary-100 p-3 rounded">中央</div>
                    <div className="bg-primary-100 p-3 rounded">右</div>
                  </Flex>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">レスポンシブ表示</h4>
                  <div className="space-y-2">
                    <Responsive show="mobile">
                      <div className="bg-red-100 p-3 rounded text-center">
                        モバイルのみ表示
                      </div>
                    </Responsive>
                    <Responsive show="tablet">
                      <div className="bg-yellow-100 p-3 rounded text-center">
                        タブレットのみ表示
                      </div>
                    </Responsive>
                    <Responsive show="desktop">
                      <div className="bg-green-100 p-3 rounded text-center">
                        デスクトップのみ表示
                      </div>
                    </Responsive>
                  </div>
                </div>
              </div>
            </Card>

            {/* Spacing Demo */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 font-japanese">スペーシング</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-primary-100 p-2 rounded">要素1</div>
                  <Spacer size="sm" direction="horizontal" />
                  <div className="bg-secondary-100 p-2 rounded">要素2</div>
                  <Spacer size="md" direction="horizontal" />
                  <div className="bg-primary-100 p-2 rounded">要素3</div>
                  <Spacer size="lg" direction="horizontal" />
                  <div className="bg-secondary-100 p-2 rounded">要素4</div>
                </div>
                
                <div>
                  <div className="bg-primary-100 p-2 rounded text-center">上の要素</div>
                  <Spacer size="md" />
                  <div className="bg-secondary-100 p-2 rounded text-center">下の要素</div>
                </div>
              </div>
            </Card>

          </Section>
        </Container>
      </Layout>
    </>
  );
};

export default ResponsiveUIDemo;