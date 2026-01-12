import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Empty, Spin, Space, Button, Modal, Image, Row, Col, Statistic } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import api from '../api/axios';

const Games = () => {
  const [activeTab, setActiveTab] = useState('sketch');
  const [games, setGames] = useState([
    { id: 'sketch', name: 'DoodleDash', status: 'available' },
    { id: 'memory', name: 'Memory Flip', status: 'available' },
    { id: 'queens', name: 'Queens Game', status: 'available' },
    { id: 'math', name: 'Quick Math', status: 'available' },
  ]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    if (activeTab) {
      fetchLeaderboard(activeTab);
    }
  }, [activeTab]);

  const fetchLeaderboard = async (gameId) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/games/leaderboard?gameId=${gameId}&limit=50`);
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const leaderboardColumns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (_, __, index) => (
        <div style={{
          fontWeight: 600,
          fontSize: 14,
          color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#666'
        }}>
          #{index + 1}
        </div>
      )
    },
    {
      title: 'Player',
      dataIndex: 'playerName',
      key: 'playerName',
      width: 150,
      render: (name, record) => (
        <Space>
          {record.playerAvatar && (
            <Image
              src={record.playerAvatar}
              alt={name}
              style={{ width: 40, height: 40, borderRadius: '50%' }}
              preview={false}
            />
          )}
          <span style={{ fontWeight: 500 }}>{name || 'Anonymous'}</span>
        </Space>
      )
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score) => (
        <span style={{ fontWeight: 600, fontSize: 16, color: '#667eea' }}>
          {score?.toLocaleString() || 0}
        </span>
      ),
      sorter: (a, b) => (b.score || 0) - (a.score || 0)
    },
    {
      title: 'Time (seconds)',
      dataIndex: 'time',
      key: 'time',
      width: 120,
      render: (time) => (
        <span style={{ color: '#666' }}>
          {time?.toFixed(2)}s
        </span>
      )
    },
    {
      title: 'Accuracy',
      dataIndex: 'accuracy',
      key: 'accuracy',
      width: 100,
      render: (accuracy) => (
        <span style={{
          fontWeight: 500,
          color: accuracy >= 80 ? '#52c41a' : accuracy >= 60 ? '#faad14' : '#f5222d'
        }}>
          {accuracy?.toFixed(1)}%
        </span>
      ),
      sorter: (a, b) => (b.accuracy || 0) - (a.accuracy || 0)
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString()
    },
  ];

  const DoodleDashGame = () => (
    <Card style={{ height: 'calc(100vh - 200px)' }}>
      <Space direction="vertical" style={{ width: '100%', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>🎨 DoodleDash Game</h2>
          <Button
            icon={<LeftOutlined />}
            onClick={() => setSelectedGame(null)}
          >
            Back to Menu
          </Button>
        </div>
        <iframe
          src={`http://localhost:8080/games/sketch`}
          style={{
            width: '100%',
            height: 'calc(100% - 60px)',
            border: 'none',
            borderRadius: '8px'
          }}
          title="DoodleDash Game"
        />
      </Space>
    </Card>
  );

  const gameContent = {
    sketch: <DoodleDashGame />,
    memory: (
      <Card title="🎮 Memory Flip Game">
        <p>Integrate Memory Flip game here</p>
      </Card>
    ),
    queens: (
      <Card title="👑 Queens Game">
        <p>Integrate Queens game here</p>
      </Card>
    ),
    math: (
      <Card title="🧮 Quick Math Game">
        <p>Integrate Quick Math game here</p>
      </Card>
    ),
  };

  const tabItems = games.map(game => ({
    key: game.id,
    label: game.name,
    children: (
      <div>
        {selectedGame === game.id ? (
          gameContent[game.id]
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => setSelectedGame(game.id)}
              style={{ width: '100%' }}
            >
              Play {game.name}
            </Button>

            <Card title={`🏆 ${game.name} Leaderboard`}>
              <Spin spinning={loading}>
                {leaderboard.length === 0 ? (
                  <Empty description="No scores yet" />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <Table
                      columns={leaderboardColumns}
                      dataSource={leaderboard.map((player, idx) => ({
                        ...player,
                        key: idx,
                        rank: idx + 1
                      }))}
                      pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Total ${total} players`
                      }}
                      size="middle"
                      scroll={{ x: 800 }}
                    />
                  </div>
                )}
              </Spin>
            </Card>
          </Space>
        )}
      </div>
    )
  }));

  return (
    <div style={{ padding: '24px' }}>
      <Card title="🎮 Gaming Hub & Leaderboards">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
};

export default Games;
