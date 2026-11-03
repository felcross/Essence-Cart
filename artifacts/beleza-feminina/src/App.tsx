import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Flower2,
  Heart,
  Leaf,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  category: string;
  volume: string;
  price: number;
  tone: string;
  note: string;
  tag: string;
  kind: 'perfume' | 'cream';
};
type CartLine = { id: string; quantity: number };
type OrderLine = { product: Product; quantity: number };
type DeliveryChoice = 'regular' | 'express';
type PaymentChoice = 'pix' | 'arrival';

const products: Product[] = [
  { id: 'iris', name: 'Brisa de Íris', category: 'Perfume', volume: '50ml', price: 189.9, tone: 'tone-iris', note: 'Íris, musk e manhã clara', tag: 'Assinatura Aura', kind: 'perfume' },
  { id: 'rosa', name: 'Rosa da Manhã', category: 'Perfume', volume: '30ml', price: 149.9, tone: 'tone-rose', note: 'Rosa fresca e folhas verdes', tag: 'Floral delicado', kind: 'perfume' },
  { id: 'ambar', name: 'Noite de Âmbar', category: 'Perfume', volume: '50ml', price: 219.9, tone: 'tone-amber', note: 'Âmbar, baunilha e especiarias', tag: 'Presença marcante', kind: 'perfume' },
  { id: 'baunilha', name: 'Nuvem de Baunilha', category: 'Creme hidratante', volume: '200ml', price: 89.9, tone: 'tone-vanilla', note: 'Toque macio, perfume suave', tag: 'Ritual de cuidado', kind: 'cream' },
  { id: 'orvalho', name: 'Orvalho de Pétalas', category: 'Creme corporal', volume: '200ml', price: 79.9, tone: 'tone-petal', note: 'Hidratação leve e confortável', tag: 'Leveza diária', kind: 'cream' },
];

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function useCart() {
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      const stored = localStorage.getItem('aura-cart');
      const parsed = stored ? (JSON.parse(stored) as CartLine[]) : [];
      return Array.isArray(parsed) ? parsed.filter((line) => products.some((product) => product.id === line.id) && line.quantity > 0) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('aura-cart', JSON.stringify(cart));
    } catch {
      // O carrinho segue disponível durante esta visita mesmo se o navegador bloquear armazenamento.
    }
  }, [cart]);
  const lines = useMemo(
    () => cart.map((line) => ({ product: products.find((product) => product.id === line.id)!, quantity: line.quantity })),
    [cart],
  );
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const add = (id: string) =>
    setCart((current) => current.some((line) => line.id === id)
      ? current.map((line) => line.id === id ? { ...line, quantity: line.quantity + 1 } : line)
      : [...current, { id, quantity: 1 }]);
  const change = (id: string, delta: number) =>
    setCart((current) => current.map((line) => line.id === id ? { ...line, quantity: line.quantity + delta } : line).filter((line) => line.quantity > 0));
  const remove = (id: string) => setCart((current) => current.filter((line) => line.id !== id));
  return { cart, lines, count, total, add, change, remove, clear: () => setCart([]) };
}

function Brand() {
  return (
    <span className="brand" aria-label="Aura, perfumaria e cuidado">
      <span className="brand-name">AURA</span>
      <span className="brand-caption">perfumes & cuidados</span>
    </span>
  );
}

function BottleArt({ product }: { product: Product }) {
  return (
    <div className={`product-visual ${product.tone}`} data-testid={`art-product-${product.id}`} aria-hidden="true">
      <span className="product-chip">{product.tag}</span>
      <div className={`product-bottle ${product.kind === 'cream' ? 'is-cream' : ''}`}>
        <div className="product-product-cap" />
        {product.kind === 'perfume' && <div className="product-product-neck" />}
        <div className="product-product-body"><span className="product-label">{product.name}</span></div>
      </div>
      <span className="product-number">{String(products.findIndex((item) => item.id === product.id) + 1).padStart(2, '0')}</span>
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (id: string) => void }) {
  return (
    <article className="product-card" data-testid={`card-product-${product.id}`}>
      <BottleArt product={product} />
      <div className="product-info">
        <div>
          <h3 className="product-title" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
          <div className="product-size">{product.category} · {product.volume}</div>
        </div>
        <div className="product-price" data-testid={`text-product-price-${product.id}`}>{money(product.price)}</div>
      </div>
      <div className="product-note">{product.note}</div>
      <button className="add-button" type="button" onClick={() => onAdd(product.id)} data-testid={`button-add-${product.id}`}>
        <Plus size={14} strokeWidth={1.7} /> Adicionar ao ritual
      </button>
    </article>
  );
}

function CartDrawer({
  open, onClose, lines, total, change, remove,
}: {
  open: boolean;
  onClose: () => void;
  lines: OrderLine[];
  total: number;
  change: (id: string, delta: number) => void;
  remove: (id: string) => void;
}) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <>
      <button className="drawer-backdrop" type="button" aria-label="Fechar sacola" onClick={onClose} data-testid="button-close-cart-backdrop" />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" data-testid="panel-cart">
        <div className="drawer-head">
          <div><h2 id="cart-title">Sua sacola</h2><p data-testid="text-cart-count">{quantity} {quantity === 1 ? 'peça escolhida' : 'peças escolhidas'}</p></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar sacola" data-testid="button-close-cart"><X size={18} /></button>
        </div>
        {lines.length === 0 ? (
          <div className="empty-cart" data-testid="empty-cart">
            <div className="empty-mark"><ShoppingBag size={26} strokeWidth={1.3} /></div>
            <h3>Ainda cabe um ritual</h3>
            <p>Sua sacola está esperando por algo que tenha a sua cara.</p>
            <button className="button-primary" type="button" onClick={onClose} data-testid="button-continue-shopping-empty">Descobrir a coleção</button>
          </div>
        ) : (
          <>
            <div className="cart-lines">
              {lines.map(({ product, quantity: itemQuantity }) => (
                <div className="cart-line" key={product.id} data-testid={`row-cart-${product.id}`}>
                  <div className={`mini-art ${product.tone}`} aria-hidden="true"><span className="mini-vial" /></div>
                  <div>
                    <h3>{product.name}</h3><div className="line-size">{product.volume} · {product.category}</div>
                    <div className="qty-control" aria-label={`Quantidade de ${product.name}`}>
                      <button type="button" onClick={() => change(product.id, -1)} aria-label={`Diminuir ${product.name}`} data-testid={`button-decrease-${product.id}`}><Minus size={12} /></button>
                      <span data-testid={`text-quantity-${product.id}`}>{itemQuantity}</span>
                      <button type="button" onClick={() => change(product.id, 1)} aria-label={`Aumentar ${product.name}`} data-testid={`button-increase-${product.id}`}><Plus size={12} /></button>
                    </div>
                  </div>
                  <div className="line-right"><div className="line-price">{money(product.price * itemQuantity)}</div><button className="remove-button" type="button" onClick={() => remove(product.id)} data-testid={`button-remove-${product.id}`}>Remover</button></div>
                </div>
              ))}
            </div>
            <div className="drawer-summary">
              <div className="summary-row"><span>Subtotal</span><span data-testid="text-cart-subtotal">{money(total)}</span></div>
              <div className="summary-row"><span>Entrega</span><span>A calcular</span></div>
              <div className="summary-row total"><span>Total parcial</span><span data-testid="text-cart-total">{money(total)}</span></div>
              <div className="drawer-actions">
                <button className="button-primary" type="button" onClick={() => { onClose(); setLocation('/checkout'); }} data-testid="button-go-checkout">Continuar para o checkout <ArrowRight size={14} /></button>
                <button className="button-secondary" type="button" onClick={onClose} data-testid="button-continue-shopping">Continuar escolhendo</button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function HomePage({
  lines, count, total, add, change, remove,
}: {
  lines: OrderLine[];
  count: number;
  total: number;
  add: (id: string) => void;
  change: (id: string, delta: number) => void;
  remove: (id: string) => void;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const addProduct = (id: string) => {
    add(id);
    const product = products.find((item) => item.id === id);
    setToast(`${product?.name ?? 'Produto'} entrou na sua sacola`);
  };
  return (
    <div className="page-shell">
      <div className="announcement">Um pequeno intervalo para você · envio demonstrativo em todo o Brasil</div>
      <header className="site-header">
        <Link href="/" className="brand-link" aria-label="Aura — início" data-testid="link-home"><Brand /></Link>
        <nav className="header-nav" aria-label="Navegação principal">
          <a href="#colecao" data-testid="link-collection">A coleção</a>
          <a href="#essencia" data-testid="link-about">Nossa essência</a>
          <button className="cart-trigger" type="button" onClick={() => setCartOpen(true)} aria-label={`Abrir sacola, ${count} itens`} data-testid="button-open-cart">
            <ShoppingBag size={15} strokeWidth={1.6} /><span>Sacola</span><span className="cart-count" data-testid="text-cart-count-header">{count}</span>
          </button>
        </nav>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow">Uma pausa, só sua</span>
            <h1 id="hero-title">O cuidado que fica <em>na pele.</em></h1>
            <p>Perfumes e gestos delicados para transformar o cotidiano em um lugar mais seu.</p>
            <a href="#colecao" className="primary-cta" data-testid="button-explore-collection">Encontre seu aroma <ArrowDownRight size={15} /></a>
          </div>
          <div className="hero-art" aria-label="Frasco de perfume Brisa de Íris em uma composição de tons rosados" role="img">
            <div className="hero-orbit" />
            <div className="hero-vessel"><div className="bottle-cap" /><div className="bottle-neck" /><div className="bottle-glass"><span className="bottle-name">AURA</span><span className="bottle-sub">brisa de íris</span></div></div>
            <div className="hero-seal">feito para<br />sentir</div>
            <span className="hero-caption">Eau de parfum · 50ml</span>
          </div>
        </section>
        <div className="ticker">Feito para acompanhar você <span>·</span> Fragrâncias com presença gentil <span>·</span> Seu tempo, seu ritual</div>

        <section className="collection" id="colecao" aria-labelledby="collection-title">
          <div className="section-heading">
            <div><span className="eyebrow">Escolhas para sentir</span><h2 id="collection-title">Pequenos encantos,<br />grandes presenças.</h2></div>
            <p>Uma coleção enxuta, feita para os dias que pedem um toque a mais de delicadeza.</p>
          </div>
          <div className="product-grid" data-testid="list-products">
            {products.map((product) => <ProductCard key={product.id} product={product} onAdd={addProduct} />)}
          </div>
        </section>

        <section className="story" id="essencia">
          <div className="story-art" role="img" aria-label="Composição artística com pétalas e formas circulares"><span className="story-mark">au</span></div>
          <div className="story-copy">
            <span className="eyebrow">A essência Aura</span>
            <h2>Um gesto de carinho também pode ser seu.</h2>
            <p>Acreditamos no luxo tranquilo de se reconhecer no próprio perfume. Cada criação nasce para acompanhar a pele, o humor e os pequenos momentos que merecem atenção.</p>
            <div className="story-foot">Respire fundo. Este instante é seu.</div>
          </div>
        </section>

        <section className="ritual-strip" aria-label="Compromissos Aura">
          <div className="ritual-item"><span className="ritual-icon"><Flower2 size={17} /></span><span><strong>Escolhas sensíveis</strong><small>Perfis olfativos autorais</small></span></div>
          <div className="ritual-item"><span className="ritual-icon"><Heart size={17} /></span><span><strong>Feito com cuidado</strong><small>Do frasco ao último detalhe</small></span></div>
          <div className="ritual-item"><span className="ritual-icon"><Leaf size={17} /></span><span><strong>Ritual sem pressa</strong><small>Um momento só seu</small></span></div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-main">
          <div><Brand /><p className="footer-copy">Aromas para habitar a própria pele com presença, leveza e intenção.</p></div>
          <div className="footer-copy">Uma perfumaria de demonstração.<br />Cada compra é fictícia e não gera cobrança.</div>
        </div>
        <div className="footer-bottom"><span>© 2025 Aura — Perfumes & Cuidados</span><span>Feito para os seus sentidos.</span></div>
      </footer>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} lines={lines} total={total} change={change} remove={remove} />
      {toast && <div className="toast-message" role="status" aria-live="polite" data-testid="status-added-to-cart"><Check size={15} />{toast}<button className="icon-button" type="button" onClick={() => { setToast(''); setCartOpen(true); }} aria-label="Ver sacola" data-testid="button-view-cart-toast"><ShoppingBag size={14} /></button></div>}
    </div>
  );
}

type BuyerDetails = {
  name: string;
  email: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};
const initialDetails: BuyerDetails = { name: '', email: '', phone: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' };

function Stepper({ step }: { step: number }) {
  const names = ['Identificação', 'Entrega', 'Pagamento', 'Revisão'];
  return (
    <div className="stepper" aria-label="Etapas do checkout" data-testid="checkout-stepper">
      {names.map((name, index) => (
        <div className={`stepper-item ${step === index ? 'active' : ''} ${step > index ? 'done' : ''}`} key={name} aria-current={step === index ? 'step' : undefined} data-testid={`step-${index + 1}`}>
          <span className="step-dot">{step > index ? <Check size={12} /> : index + 1}</span><span>{name}</span>
          {index < names.length - 1 && <span className="step-line" />}
        </div>
      ))}
    </div>
  );
}

function OrderSummary({ lines, delivery }: { lines: OrderLine[]; delivery: DeliveryChoice }) {
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = delivery === 'express' ? 18.9 : 9.9;
  return (
    <aside className="order-card" aria-label="Resumo da sacola" data-testid="panel-order-summary">
      <h2>Seu resumo</h2>
      {lines.map(({ product, quantity }) => (
        <div className="order-item" key={product.id} data-testid={`summary-item-${product.id}`}>
          <span>{product.name}<small>{quantity} × {money(product.price)}</small></span><span>{money(product.price * quantity)}</span>
        </div>
      ))}
      <div className="order-totals">
        <div className="summary-row"><span>Subtotal</span><span data-testid="text-checkout-subtotal">{money(subtotal)}</span></div>
        <div className="summary-row"><span>Entrega</span><span data-testid="text-shipping">{money(shipping)}</span></div>
        <div className="summary-row total"><span>Total</span><span data-testid="text-checkout-total">{money(subtotal + shipping)}</span></div>
      </div>
      <div className="demo-note"><ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Demonstração: nenhum pagamento será processado.</div>
    </aside>
  );
}

function Field({
  label, name, value, onChange, type = 'text', placeholder, required, error, className = '',
}: {
  label: string; name: keyof BuyerDetails; value: string; onChange: (name: keyof BuyerDetails, value: string) => void;
  type?: string; placeholder?: string; required?: boolean; error?: string; className?: string;
}) {
  return (
    <div className={`field ${className}`}>
      <label htmlFor={`field-${name}`}>{label}{required ? ' *' : ''}</label>
      <input id={`field-${name}`} name={name} type={type} value={value} placeholder={placeholder} autoComplete={name === 'name' ? 'name' : name === 'email' ? 'email' : name === 'phone' ? 'tel' : name === 'cep' ? 'postal-code' : 'off'} onChange={(event) => onChange(name, event.target.value)} aria-invalid={!!error} aria-describedby={error ? `error-${name}` : undefined} data-testid={`input-${name}`} />
      {error && <span id={`error-${name}`} className="field-error" data-testid={`error-${name}`}>{error}</span>}
    </div>
  );
}

function CheckoutPage({
  lines, clear,
}: {
  lines: OrderLine[]; clear: () => void;
}) {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<BuyerDetails>(initialDetails);
  const [errors, setErrors] = useState<Partial<Record<keyof BuyerDetails, string>>>({});
  const [alert, setAlert] = useState('');
  const [delivery, setDelivery] = useState<DeliveryChoice>('regular');
  const [payment, setPayment] = useState<PaymentChoice>('pix');
  const [confirmed, setConfirmed] = useState(false);
  const [receipt, setReceipt] = useState<OrderLine[]>([]);
  const [receiptDelivery, setReceiptDelivery] = useState<DeliveryChoice>('regular');
  const update = (name: keyof BuyerDetails, value: string) => {
    setDetails((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setAlert('');
  };
  const validateIdentity = () => {
    const next: Partial<Record<keyof BuyerDetails, string>> = {};
    if (details.name.trim().length < 3) next.name = 'Informe seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) next.email = 'Digite um e-mail válido para esta demonstração.';
    if (details.phone.replace(/\D/g, '').length < 10) next.phone = 'Informe um telefone com DDD.';
    if (details.cep.replace(/\D/g, '').length !== 8) next.cep = 'O CEP deve ter 8 números.';
    if (details.street.trim().length < 3) next.street = 'Informe o nome da rua ou avenida.';
    if (!details.number.trim()) next.number = 'Informe o número do endereço.';
    if (details.neighborhood.trim().length < 2) next.neighborhood = 'Informe o bairro.';
    if (details.city.trim().length < 2) next.city = 'Informe a cidade.';
    if (details.state.trim().length !== 2) next.state = 'Use a sigla de 2 letras.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const advance = () => {
    setAlert('');
    if (step === 0 && !validateIdentity()) {
      setAlert('Confira os campos destacados para seguir. Todos os dados são usados apenas nesta demonstração.');
      return;
    }
    if (step < 3) setStep((current) => current + 1);
    else {
      setReceipt(lines);
      setReceiptDelivery(delivery);
      clear();
      setConfirmed(true);
    }
  };
  const goBack = () => { if (step > 0) { setStep((current) => current - 1); setAlert(''); } else setLocation('/'); };
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const grandTotal = subtotal + (delivery === 'express' ? 18.9 : 9.9);
  const addressLine = `${details.street}, ${details.number}${details.complement ? `, ${details.complement}` : ''} — ${details.neighborhood}, ${details.city}/${details.state.toUpperCase()}, ${details.cep}`;

  if (confirmed) {
    return (
      <div className="checkout-page">
        <header className="checkout-top"><Link href="/" className="brand-link" data-testid="link-home-confirmation"><Brand /></Link><Link href="/" className="back-link" data-testid="link-return-store"><ArrowLeft size={15} /> Voltar à loja</Link></header>
        <section className="success-panel" data-testid="panel-order-confirmation">
          <div className="success-medallion"><CheckCircle2 size={36} strokeWidth={1.2} /></div>
          <span className="eyebrow" style={{ justifyContent: 'center' }}>Um pedido de faz de conta</span>
          <h1>Seu ritual está<br />reservado.</h1>
          <p>Obrigada por visitar a Aura, {details.name.split(' ')[0] || 'por aqui'}. Esta confirmação é apenas demonstrativa: não houve cobrança nem envio de dados de pagamento.</p>
          <div className="success-summary">
            <h2>Resumo da escolha</h2>
            {receipt.map(({ product, quantity }) => <div className="order-item" key={product.id}><span>{product.name}<small>{quantity} × {money(product.price)}</small></span><span>{money(product.price * quantity)}</span></div>)}
            <div className="summary-row" style={{ marginTop: 14 }}><span>Entrega simulada</span><span>{money(receiptDelivery === 'express' ? 18.9 : 9.9)}</span></div>
            <div className="summary-row total"><span>Total demonstrativo</span><span data-testid="text-confirmation-total">{money(receipt.reduce((sum, line) => sum + line.product.price * line.quantity, 0) + (receiptDelivery === 'express' ? 18.9 : 9.9))}</span></div>
          </div>
          <button className="button-primary" type="button" onClick={() => setLocation('/')} data-testid="button-back-to-store">Voltar para a loja <ArrowRight size={14} /></button>
        </section>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="checkout-page">
        <header className="checkout-top"><Link href="/" className="brand-link" data-testid="link-home-checkout"><Brand /></Link><Link href="/" className="back-link" data-testid="link-back-store"><ArrowLeft size={15} /> Continuar na loja</Link></header>
        <div className="empty-cart" style={{ minHeight: '65vh' }} data-testid="empty-checkout"><div className="empty-mark"><ShoppingBag size={27} /></div><h3>Sua sacola está vazia</h3><p>Escolha um aroma para começar seu ritual.</p><Link className="button-primary" href="/" data-testid="button-shop-empty">Conhecer a coleção</Link></div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-top"><Link href="/" className="brand-link" data-testid="link-home-checkout"><Brand /></Link><Link href="/" className="back-link" data-testid="link-back-store"><ArrowLeft size={15} /> Voltar à loja</Link></header>
      <main className="checkout-wrap">
        <div className="checkout-title"><div><span className="eyebrow">Um último momento</span><h1>Seu ritual, em caminho.</h1></div><p>Este checkout é uma simulação. Não solicitamos dados de cartão e nenhum pagamento será processado.</p></div>
        <div className="checkout-layout">
          <section className="checkout-main" aria-label="Etapas do checkout">
            <Stepper step={step} />
            <div className="checkout-form">
              {alert && <div className="form-alert" role="alert" data-testid="status-checkout-error">{alert}</div>}
              {step === 0 && (
                <>
                  <h2 className="form-title">Para quem preparamos?</h2>
                  <p className="form-subtitle">Conte só o necessário para esta compra de demonstração.</p>
                  <div className="field-grid">
                    <Field label="Nome completo" name="name" value={details.name} onChange={update} placeholder="Seu nome" required error={errors.name} className="full" />
                    <Field label="E-mail" name="email" value={details.email} onChange={update} placeholder="voce@exemplo.com" type="email" required error={errors.email} />
                    <Field label="Telefone com DDD" name="phone" value={details.phone} onChange={update} placeholder="(11) 99999-0000" type="tel" required error={errors.phone} />
                    <Field label="CEP" name="cep" value={details.cep} onChange={update} placeholder="00000-000" required error={errors.cep} />
                    <Field label="Rua ou avenida" name="street" value={details.street} onChange={update} placeholder="Nome da via" required error={errors.street} className="full" />
                    <Field label="Número" name="number" value={details.number} onChange={update} placeholder="Nº" required error={errors.number} />
                    <Field label="Complemento" name="complement" value={details.complement} onChange={update} placeholder="Apto, bloco (opcional)" />
                    <Field label="Bairro" name="neighborhood" value={details.neighborhood} onChange={update} placeholder="Seu bairro" required error={errors.neighborhood} />
                    <Field label="Cidade" name="city" value={details.city} onChange={update} placeholder="Sua cidade" required error={errors.city} />
                    <Field label="Estado (UF)" name="state" value={details.state} onChange={update} placeholder="SP" required error={errors.state} />
                  </div>
                  <div className="notice"><ShieldCheck size={16} />Não use dados sensíveis. Esta tela não envia informações para nenhum serviço.</div>
                </>
              )}
              {step === 1 && (
                <>
                  <h2 className="form-title">Como chega até você?</h2>
                  <p className="form-subtitle">Escolha uma modalidade fictícia de entrega. Os prazos são ilustrativos.</p>
                  <div className="choice-list">
                    <label className={`choice-card ${delivery === 'regular' ? 'selected' : ''}`} data-testid="choice-delivery-regular">
                      <input type="radio" name="delivery" value="regular" checked={delivery === 'regular'} onChange={() => setDelivery('regular')} data-testid="input-delivery-regular" />
                      <Truck size={18} color="#845a5c" /><span><strong>Entrega com calma</strong><small>Até 5 dias úteis · demonstração</small></span><span className="choice-price">{money(9.9)}</span>
                    </label>
                    <label className={`choice-card ${delivery === 'express' ? 'selected' : ''}`} data-testid="choice-delivery-express">
                      <input type="radio" name="delivery" value="express" checked={delivery === 'express'} onChange={() => setDelivery('express')} data-testid="input-delivery-express" />
                      <Sparkles size={18} color="#845a5c" /><span><strong>Entrega cuidadosa expressa</strong><small>Até 2 dias úteis · demonstração</small></span><span className="choice-price">{money(18.9)}</span>
                    </label>
                  </div>
                  <div className="notice"><Truck size={16} />Destino: {addressLine}</div>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 className="form-title">Uma forma de concluir</h2>
                  <p className="form-subtitle">Selecione uma opção apenas para testar o fluxo. Nenhum dado bancário será pedido.</p>
                  <div className="choice-list">
                    <label className={`choice-card ${payment === 'pix' ? 'selected' : ''}`} data-testid="choice-payment-pix">
                      <input type="radio" name="payment" value="pix" checked={payment === 'pix'} onChange={() => setPayment('pix')} data-testid="input-payment-pix" />
                      <Sparkles size={18} color="#845a5c" /><span><strong>Pix demonstrativo</strong><small>Sem chave, QR code ou transferência real</small></span>
                    </label>
                    <label className={`choice-card ${payment === 'arrival' ? 'selected' : ''}`} data-testid="choice-payment-arrival">
                      <input type="radio" name="payment" value="arrival" checked={payment === 'arrival'} onChange={() => setPayment('arrival')} data-testid="input-payment-arrival" />
                      <Heart size={18} color="#845a5c" /><span><strong>Combinar depois</strong><small>Opção fictícia para a demonstração</small></span>
                    </label>
                  </div>
                  <div className="notice"><ShieldCheck size={16} /><span><strong>Segurança primeiro.</strong> Não informe número de cartão, validade, código de segurança ou senha. O Aura não processa pagamentos.</span></div>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 className="form-title">Tudo como você escolheu.</h2>
                  <p className="form-subtitle">Revise os detalhes antes de concluir esta compra fictícia.</p>
                  <div className="review-block">
                    <div className="review-block-head">Identificação e endereço <button className="text-link" type="button" onClick={() => setStep(0)} data-testid="button-edit-identification">Editar</button></div>
                    <div className="review-copy">{details.name}<br />{details.email} · {details.phone}<br />{addressLine}</div>
                  </div>
                  <div className="review-block">
                    <div className="review-block-head">Entrega <button className="text-link" type="button" onClick={() => setStep(1)} data-testid="button-edit-delivery">Editar</button></div>
                    <div className="review-copy">{delivery === 'regular' ? 'Entrega com calma · até 5 dias úteis' : 'Entrega cuidadosa expressa · até 2 dias úteis'}</div>
                  </div>
                  <div className="review-block">
                    <div className="review-block-head">Pagamento simulado <button className="text-link" type="button" onClick={() => setStep(2)} data-testid="button-edit-payment">Editar</button></div>
                    <div className="review-copy">{payment === 'pix' ? 'Pix demonstrativo — nenhuma transferência real' : 'Combinar depois — opção demonstrativa'}</div>
                  </div>
                  <div className="notice"><ShieldCheck size={16} />Ao concluir, nada será cobrado. Esta compra não gera pedido real.</div>
                </>
              )}
              <div className="checkout-actions">
                <button className="button-secondary" type="button" onClick={goBack} data-testid="button-checkout-back">{step === 0 ? 'Voltar à loja' : 'Etapa anterior'}</button>
                <button className="button-primary" type="button" onClick={advance} data-testid={step === 3 ? 'button-confirm-demo-order' : 'button-checkout-next'}>{step === 3 ? 'Concluir demonstração' : 'Continuar'} <ChevronRight size={14} /></button>
              </div>
            </div>
          </section>
          <OrderSummary lines={lines} delivery={delivery} />
        </div>
      </main>
    </div>
  );
}

function NotFoundPage() {
  return <main className="success-panel"><span className="eyebrow">Aura</span><h1>Este caminho não existe.</h1><p>Volte para a coleção e encontre seu próximo ritual.</p><Link className="button-primary" href="/" data-testid="link-not-found-home">Ir para a loja <ArrowRight size={14} /></Link></main>;
}

function App() {
  const cart = useCart();
  const lines = cart.lines;
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Switch>
        <Route path="/checkout">
          <CheckoutPage lines={lines} clear={cart.clear} />
        </Route>
        <Route path="/">
          <HomePage lines={lines} count={cart.count} total={cart.total} add={cart.add} change={cart.change} remove={cart.remove} />
        </Route>
        <Route><NotFoundPage /></Route>
      </Switch>
    </WouterRouter>
  );
}

export default App;
