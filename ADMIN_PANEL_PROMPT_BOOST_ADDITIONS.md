# 🚀 Дополнения к промпту Claude для создания админки - BOOST монетизация

## 📝 Добавить в промпт для Claude

Скопируйте этот текст и добавьте в промпт для Claude при создании админ-панели:

---

## ============================================
## ДОПОЛНЕНИЕ: BOOST МОНЕТИЗАЦИЯ (НОВОЕ!)
## ============================================

### 💰 МОДУЛЬ: BOOST Analytics

Создайте новую страницу `app/boost/page.tsx` с главным дашбордом BOOST аналитики.

#### Карточки метрик (Grid 2x3):

```typescript
<div className="grid grid-cols-3 gap-4">
  {/* Доход за сегодня */}
  <MetricCard
    title="Доход сегодня"
    value="12,450 сом"
    change="+15.2%"
    trend="up"
    icon={<DollarSignIcon />}
  />
  
  {/* Доход за месяц */}
  <MetricCard
    title="Доход за месяц"
    value="385,600 сом"
    change="+22.5%"
    trend="up"
  />
  
  {/* Активных BOOST */}
  <MetricCard
    title="Активных BOOST"
    value="234"
    subtitle="18 истекают сегодня"
  />
  
  {/* Всего транзакций */}
  <MetricCard
    title="Всего транзакций"
    value="1,847"
    subtitle="За все время"
  />
  
  {/* Конверсия */}
  <MetricCard
    title="Конверсия"
    value="18.5%"
    change="+2.1%"
    subtitle="Объявления → BOOST"
  />
  
  {/* Средний чек */}
  <MetricCard
    title="Средний чек"
    value="165 сом"
    change="+5.3%"
  />
</div>
```

#### График доходов (Recharts Line Chart):

```typescript
<Card title="Доход от BOOST" subtitle="Последние 30 дней">
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={revenueData}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="revenue" 
        stroke="#FF3B30" 
        strokeWidth={2}
        name="Доход (сом)"
      />
      <Line 
        type="monotone" 
        dataKey="transactions" 
        stroke="#007AFF" 
        name="Транзакции"
      />
    </LineChart>
  </ResponsiveContainer>
</Card>
```

#### Распределение по тарифам (Pie Chart):

```typescript
<Card title="Популярность тарифов">
  <PieChart width={400} height={300}>
    <Pie
      data={[
        { name: '⭐ Выделение (50 сом)', value: 45, fill: '#FFA500' },
        { name: '🔥 ТОП (150 сом)', value: 40, fill: '#FF3B30' },
        { name: '💎 Премиум (300 сом)', value: 15, fill: '#FFD700' }
      ]}
      cx="50%"
      cy="50%"
      labelLine={false}
      label={renderCustomLabel}
      outerRadius={80}
    />
    <Tooltip />
    <Legend />
  </PieChart>
</Card>
```

#### Платежные системы (Bar Chart):

```typescript
<Card title="Распределение по банкам">
  <BarChart width={600} height={300} data={paymentMethodsData}>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="count" fill="#007AFF" name="Транзакций" />
    <Bar dataKey="revenue" fill="#4CAF50" name="Доход (сом)" />
  </BarChart>
</Card>
```

---

### 📊 МОДУЛЬ: BOOST Transactions

Создайте страницу `app/boost/transactions/page.tsx` с таблицей всех транзакций.

#### Фильтры:

```typescript
<Filters>
  <Select label="Статус">
    <Option value="">Все</Option>
    <Option value="success">Успешные</Option>
    <Option value="pending">Ожидают</Option>
    <Option value="failed">Неудачные</Option>
    <Option value="cancelled">Отменены</Option>
  </Select>
  
  <Select label="Тип BOOST">
    <Option value="">Все</Option>
    <Option value="basic">⭐ Выделение</Option>
    <Option value="top">🔥 ТОП</Option>
    <Option value="premium">💎 Премиум</Option>
  </Select>
  
  <Select label="Платежная система">
    <Option value="">Все</Option>
    <Option value="mbank">Mbank</Option>
    <Option value="bakai">Bakai Bank</Option>
    <Option value="obank">O!Bank</Option>
    <Option value="optima">Optima Bank</Option>
  </Select>
  
  <DateRangePicker label="Период" />
  
  <Input 
    type="search" 
    placeholder="Поиск по ID, телефону, авто..." 
  />
</Filters>
```

#### Таблица (TanStack Table):

```typescript
const columns = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <code className="text-xs">{row.original.id.slice(0, 8)}</code>
    )
  },
  {
    accessorKey: 'created_at',
    header: 'Дата',
    cell: ({ row }) => formatDate(row.original.created_at)
  },
  {
    accessorKey: 'user',
    header: 'Пользователь',
    cell: ({ row }) => (
      <Link href={`/users/${row.original.user_id}`}>
        {row.original.user?.name || 'N/A'}
      </Link>
    )
  },
  {
    accessorKey: 'car',
    header: 'Автомобиль',
    cell: ({ row }) => (
      <Link href={`/cars/${row.original.car_id}`}>
        {row.original.car?.brand} {row.original.car?.model}
      </Link>
    )
  },
  {
    accessorKey: 'boost_type',
    header: 'Тариф',
    cell: ({ row }) => <BoostTypeBadge type={row.original.boost_type} />
  },
  {
    accessorKey: 'amount',
    header: 'Сумма',
    cell: ({ row }) => `${row.original.amount} сом`
  },
  {
    accessorKey: 'payment_method',
    header: 'Банк',
    cell: ({ row }) => <PaymentMethodBadge method={row.original.payment_method} />
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => <StatusBadge status={row.original.status} />
  },
  {
    accessorKey: 'activated_at',
    header: 'Активирован',
    cell: ({ row }) => row.original.activated_at 
      ? formatDateTime(row.original.activated_at)
      : '—'
  },
  {
    accessorKey: 'expires_at',
    header: 'Истекает',
    cell: ({ row }) => row.original.expires_at
      ? formatDateTime(row.original.expires_at)
      : '—'
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuItem onClick={() => viewDetails(row.original.id)}>
          Детали
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => viewPayment(row.original.payment_id)}>
          Платеж
        </DropdownMenuItem>
        {row.original.status === 'failed' && (
          <DropdownMenuItem onClick={() => retryPayment(row.original.id)}>
            Повторить
          </DropdownMenuItem>
        )}
      </DropdownMenu>
    )
  }
];
```

#### Детали транзакции (Dialog):

```typescript
<Dialog open={showDetails}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Транзакция #{transaction.id.slice(0, 8)}</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Основная информация */}
      <Section title="Информация">
        <KeyValue label="ID" value={transaction.id} />
        <KeyValue label="Статус" value={<StatusBadge status={transaction.status} />} />
        <KeyValue label="Создана" value={formatDateTime(transaction.created_at)} />
        <KeyValue label="Обновлена" value={formatDateTime(transaction.updated_at)} />
      </Section>
      
      {/* BOOST информация */}
      <Section title="BOOST">
        <KeyValue label="Тип" value={<BoostTypeBadge type={transaction.boost_type} />} />
        <KeyValue label="Длительность" value={`${transaction.duration_hours} часов`} />
        <KeyValue label="Активирован" value={formatDateTime(transaction.activated_at)} />
        <KeyValue label="Истекает" value={formatDateTime(transaction.expires_at)} />
      </Section>
      
      {/* Платеж */}
      <Section title="Платеж">
        <KeyValue label="Сумма" value={`${transaction.amount} ${transaction.currency}`} />
        <KeyValue label="Метод" value={<PaymentMethodBadge method={transaction.payment_method} />} />
        <KeyValue label="Payment ID" value={transaction.payment_id} />
        <KeyValue label="Payment URL" value={
          <a href={transaction.payment_url} target="_blank">Открыть</a>
        } />
      </Section>
      
      {/* Эффективность */}
      <Section title="Эффективность">
        <KeyValue label="Просмотры до" value={transaction.views_before} />
        <KeyValue label="Просмотры во время" value={transaction.views_during} />
        <KeyValue label="Просмотры после" value={transaction.views_after || '—'} />
        <KeyValue label="Прирост" value={`+${transaction.views_during - transaction.views_before}`} />
        <KeyValue label="Множитель" value={
          `×${(transaction.views_during / transaction.views_before || 0).toFixed(1)}`
        } />
      </Section>
      
      {/* Метаданные */}
      {transaction.metadata && (
        <Section title="Метаданные">
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(transaction.metadata, null, 2)}
          </pre>
        </Section>
      )}
    </div>
  </DialogContent>
</Dialog>
```

---

### 📈 МОДУЛЬ: Active Boosts

Создайте страницу `app/boost/active/page.tsx` со списком всех активных BOOST.

```typescript
<Card title="Активные BOOST" subtitle={`${activeBoosts.length} активных`}>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Автомобиль</TableHead>
        <TableHead>Продавец</TableHead>
        <TableHead>Тип BOOST</TableHead>
        <TableHead>Активирован</TableHead>
        <TableHead>Осталось</TableHead>
        <TableHead>Просмотры</TableHead>
        <TableHead>Действия</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {activeBoosts.map((boost) => (
        <TableRow key={boost.car_id}>
          <TableCell>
            <div className="flex items-center">
              <img src={boost.thumbnail} className="w-16 h-12 rounded object-cover" />
              <div className="ml-3">
                <div className="font-medium">{boost.brand} {boost.model}</div>
                <div className="text-sm text-gray-500">{boost.year}</div>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Link href={`/users/${boost.seller_id}`}>
              {boost.seller_name}
            </Link>
          </TableCell>
          <TableCell>
            <BoostTypeBadge type={boost.boost_type} />
          </TableCell>
          <TableCell>
            {formatRelativeTime(boost.boost_activated_at)}
          </TableCell>
          <TableCell>
            <div className="flex items-center">
              <ClockIcon className="mr-1 text-orange-500" />
              <span>{boost.hours_remaining.toFixed(1)} ч</span>
            </div>
          </TableCell>
          <TableCell>
            <div className="text-sm">
              <div className="text-green-600 font-semibold">
                {boost.current_views}
              </div>
              <div className="text-gray-500">
                было: {boost.views_before}
              </div>
            </div>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuItem>Просмотреть</DropdownMenuItem>
              <DropdownMenuItem>Продлить</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Деактивировать
              </DropdownMenuItem>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Card>
```

---

### 🔧 МОДУЛЬ: Boost Settings

Создайте страницу `app/settings/boost/page.tsx` для управления тарифами и настройками.

#### Тарифы BOOST:

```typescript
<Card title="Тарифы BOOST">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Тариф</TableHead>
        <TableHead>Цена</TableHead>
        <TableHead>Длительность</TableHead>
        <TableHead>Множитель</TableHead>
        <TableHead>Активен</TableHead>
        <TableHead>Действия</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>
          <div className="flex items-center">
            <span className="mr-2">⭐</span>
            <span>Выделение</span>
          </div>
        </TableCell>
        <TableCell>
          <Input type="number" value={50} suffix="сом" />
        </TableCell>
        <TableCell>
          <Input type="number" value={24} suffix="ч" />
        </TableCell>
        <TableCell>×2</TableCell>
        <TableCell>
          <Switch checked={true} />
        </TableCell>
        <TableCell>
          <Button size="sm">Сохранить</Button>
        </TableCell>
      </TableRow>
      {/* Аналогично для ТОП и Премиум */}
    </TableBody>
  </Table>
</Card>
```

#### Платежные системы:

```typescript
<Card title="Платежные системы">
  <div className="space-y-4">
    {/* Mbank */}
    <div className="border rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            M
          </div>
          <div className="ml-3">
            <h3 className="font-semibold">Mbank</h3>
            <p className="text-sm text-gray-500">Банковские карты</p>
          </div>
        </div>
        <Switch checked={true} label="Активен" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>API Key</Label>
          <Input type="password" value="sk_test_..." />
        </div>
        <div>
          <Label>Merchant ID</Label>
          <Input value="merchant_..." />
        </div>
        <div>
          <Label>Webhook URL</Label>
          <Input value="https://api.360auto.kg/webhooks/mbank" readOnly />
        </div>
        <div>
          <Label>Комиссия</Label>
          <Input type="number" value={0} suffix="%" />
        </div>
      </div>
      
      <div className="mt-4 flex space-x-2">
        <Button variant="outline" size="sm">Тест подключения</Button>
        <Button size="sm">Сохранить</Button>
      </div>
      
      <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
        <div className="flex items-center text-green-700 text-sm">
          <CheckCircleIcon className="mr-2" />
          <span>Подключено • Последняя транзакция: 2 минуты назад</span>
        </div>
      </div>
    </div>
    
    {/* Аналогично для Bakai, O!Bank, Optima */}
  </div>
</Card>
```

#### Автоматизация:

```typescript
<Card title="Автоматизация">
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <Label>Автоматическая деактивация истекших BOOST</Label>
        <p className="text-sm text-gray-500">
          Запускается каждый час через Cron Job
        </p>
      </div>
      <Switch checked={true} />
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <Label>Push уведомления об истечении</Label>
        <p className="text-sm text-gray-500">
          За 2 часа до окончания BOOST
        </p>
      </div>
      <Switch checked={true} />
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <Label>Email отчеты о доходах</Label>
        <p className="text-sm text-gray-500">
          Ежедневно в 9:00
        </p>
      </div>
      <Switch checked={true} />
    </div>
  </div>
</Card>
```

---

### 🔍 МОДУЛЬ: Webhooks Log

Создайте страницу `app/boost/webhooks/page.tsx` с логами webhook запросов.

```typescript
<Card title="Webhook Логи" subtitle="Последние 1000 запросов">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Время</TableHead>
        <TableHead>Источник</TableHead>
        <TableHead>Event</TableHead>
        <TableHead>Payment ID</TableHead>
        <TableHead>Статус</TableHead>
        <TableHead>IP</TableHead>
        <TableHead>Действия</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {webhookLogs.map((log) => (
        <TableRow key={log.id} className={log.success ? '' : 'bg-red-50'}>
          <TableCell>{formatDateTime(log.created_at)}</TableCell>
          <TableCell>
            <Badge variant={getBankColor(log.source)}>
              {log.source}
            </Badge>
          </TableCell>
          <TableCell>
            <code className="text-xs">{log.event}</code>
          </TableCell>
          <TableCell>
            <code className="text-xs">{log.payment_id}</code>
          </TableCell>
          <TableCell>
            {log.success ? (
              <Badge variant="success">Успешно</Badge>
            ) : (
              <Badge variant="destructive">Ошибка</Badge>
            )}
          </TableCell>
          <TableCell>{log.ip_address}</TableCell>
          <TableCell>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => viewWebhookDetails(log.id)}
            >
              Детали
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Card>
```

---

### 📊 ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ МОДУЛЕЙ

#### Dashboard (app/page.tsx):

Добавить секцию BOOST в главный дашборд:

```typescript
<section>
  <h2 className="text-xl font-bold mb-4">💰 BOOST Монетизация</h2>
  <div className="grid grid-cols-4 gap-4">
    <MetricCard
      title="Доход сегодня"
      value="12,450 сом"
      change="+15%"
      icon={<DollarSignIcon />}
      link="/boost"
    />
    <MetricCard
      title="Активных BOOST"
      value="234"
      link="/boost/active"
    />
    <MetricCard
      title="Транзакций"
      value="1,847"
      link="/boost/transactions"
    />
    <MetricCard
      title="Конверсия"
      value="18.5%"
      change="+2.1%"
    />
  </div>
</section>
```

#### Cars (app/cars/[id]/page.tsx):

Добавить секцию BOOST в детали авто:

```typescript
{car.boost_type && (
  <Card title="🚀 BOOST Активен">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <BoostTypeBadge type={car.boost_type} />
        <Badge variant="success">Активен</Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Активирован</div>
          <div className="font-semibold">
            {formatDateTime(car.boost_activated_at)}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Истекает</div>
          <div className="font-semibold">
            {formatDateTime(car.boost_expires_at)}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Осталось</div>
          <div className="font-semibold text-orange-600">
            {getHoursRemaining(car.boost_expires_at)} ч
          </div>
        </div>
      </div>
      
      <div>
        <div className="text-sm text-gray-500 mb-2">Эффективность</div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-2xl font-bold">{car.views_before_boost}</div>
            <div className="text-xs text-gray-500">До BOOST</div>
          </div>
          <ArrowRightIcon />
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{car.views}</div>
            <div className="text-xs text-gray-500">Сейчас</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ×{(car.views / car.views_before_boost).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Множитель</div>
          </div>
        </div>
      </div>
    </div>
  </Card>
)}
```

#### Users (app/users/[id]/page.tsx):

Добавить статистику BOOST пользователя:

```typescript
<Card title="💰 BOOST Статистика">
  <div className="grid grid-cols-3 gap-4">
    <div>
      <div className="text-2xl font-bold">{user.boost_stats.total_spent} сом</div>
      <div className="text-sm text-gray-500">Потрачено всего</div>
    </div>
    <div>
      <div className="text-2xl font-bold">{user.boost_stats.total_boosts}</div>
      <div className="text-sm text-gray-500">Всего BOOST</div>
    </div>
    <div>
      <div className="text-2xl font-bold">
        ×{user.boost_stats.avg_multiplier.toFixed(1)}
      </div>
      <div className="text-sm text-gray-500">Средний эффект</div>
    </div>
  </div>
</Card>
```

---

### 🛠️ API ENDPOINTS

Создайте следующие API endpoints для админки:

```typescript
// GET /api/admin/boost/stats
{
  today_revenue: 12450,
  month_revenue: 385600,
  active_boosts: 234,
  total_transactions: 1847,
  conversion_rate: 18.5,
  average_ticket: 165
}

// GET /api/admin/boost/transactions
{
  data: [...],
  pagination: {...}
}

// GET /api/admin/boost/active
[...]

// GET /api/admin/boost/webhooks
[...]

// POST /api/admin/boost/settings
{...}
```

---

### 🎨 UI КОМПОНЕНТЫ

Создайте следующие компоненты в `components/admin/`:

```typescript
// components/admin/BoostTypeBadge.tsx
export function BoostTypeBadge({ type }) {
  const config = {
    basic: { emoji: '⭐', label: 'Выделение', color: 'orange' },
    top: { emoji: '🔥', label: 'ТОП', color: 'red' },
    premium: { emoji: '💎', label: 'Премиум', color: 'yellow' }
  };
  
  return (
    <Badge variant={config[type].color}>
      {config[type].emoji} {config[type].label}
    </Badge>
  );
}

// components/admin/PaymentMethodBadge.tsx
// components/admin/StatusBadge.tsx
```

---

### 📋 НАВИГАЦИЯ

Обновите sidebar навигацию:

```typescript
{
  title: "Монетизация",
  items: [
    {
      title: "BOOST Analytics",
      href: "/boost",
      icon: TrendingUpIcon
    },
    {
      title: "Транзакции",
      href: "/boost/transactions",
      icon: CreditCardIcon
    },
    {
      title: "Активные BOOST",
      href: "/boost/active",
      icon: ZapIcon,
      badge: activeBoostsCount
    },
    {
      title: "Webhooks",
      href: "/boost/webhooks",
      icon: WebhookIcon
    },
    {
      title: "Настройки",
      href: "/settings/boost",
      icon: SettingsIcon
    }
  ]
}
```

---

### 🔐 PERMISSIONS

Добавьте новые роли и разрешения:

```typescript
const permissions = {
  admin: ['*'],
  moderator: [
    'boost:view',
    'boost:transactions',
    'cars:view',
    'users:view'
  ],
  analyst: [
    'boost:view',
    'boost:analytics',
    'boost:export'
  ],
  finance: [
    'boost:view',
    'boost:transactions',
    'boost:webhooks',
    'boost:settings'
  ]
};
```

---

### 🗄️ БАЗА ДАННЫХ

Используйте следующие таблицы из Supabase:

- `boost_transactions` - все транзакции
- `webhook_logs` - логи webhook'ов
- `cars` - обновлена с полями BOOST
- `users` - для связи с транзакциями

---

## 🎉 ИТОГ

Теперь админка полностью поддерживает BOOST монетизацию с:

1. ✅ BOOST Analytics дашборд
2. ✅ Управление транзакциями
3. ✅ Мониторинг активных BOOST
4. ✅ Логи webhook'ов
5. ✅ Настройки тарифов и банков
6. ✅ Интеграция в существующие модули
7. ✅ API endpoints
8. ✅ UI компоненты
9. ✅ Навигация и permissions

---

**Конец дополнений для промпта Claude**


