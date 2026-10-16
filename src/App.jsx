import { useState } from "react";
import "./App.css";

// Endereço da API do seu colega (FastAPI). Troque se ela rodar em outro lugar.
const API = "http://localhost:8000";

// Estado inicial vazio. Os dados virão da API (ou serão cadastrados pelas telas).
const INICIAL = {
  familias: [],
  eventos: [],
  inv: { Insumos: [], Ferramentas: [], Maquinários: [] },
  caixa: { Entradas: [], Saídas: [], Previsões: [] },
};

// Tabela com Novo / Editar / Deletar. Reaproveitada em quase todas as telas.
function Crud({ titulo, campos, itens, onChange, somenteLeitura, extra }) {
  const vazio = Object.fromEntries(campos.map((c) => [c.k, ""]));
  const [form, setForm] = useState(null);

  const salvar = (e) => {
    e.preventDefault();
    onChange(
      form.id
        ? itens.map((i) => (i.id === form.id ? form : i))
        : [...itens, { ...form, id: Date.now() }]
    );
    setForm(null);
  };

  return (
    <section>
      <div className="topo">
        <h2>{titulo}</h2>
        {!somenteLeitura && <button onClick={() => setForm(vazio)}>+ Novo</button>}
      </div>
      {form && (
        <form className="form" onSubmit={salvar}>
          {campos.map((c) => (
            <label key={c.k}>
              {c.l}
              <input
                required
                type={c.t || "text"}
                value={form[c.k]}
                onChange={(e) => setForm({ ...form, [c.k]: e.target.value })}
              />
            </label>
          ))}
          <button>Salvar</button>
          <button type="button" className="sec" onClick={() => setForm(null)}>Cancelar</button>
        </form>
      )}
      <table>
        <thead>
          <tr>{campos.map((c) => <th key={c.k}>{c.l}</th>)}<th></th></tr>
        </thead>
        <tbody>
          {itens.map((i) => (
            <tr key={i.id}>
              {campos.map((c) => <td key={c.k}>{i[c.k]}</td>)}
              <td className="acoes">
                {extra && extra(i)}
                {!somenteLeitura && (
                  <>
                    <button className="sec" onClick={() => setForm(i)}>Editar</button>
                    <button className="perigo" onClick={() => window.confirm("Deletar?") && onChange(itens.filter((x) => x.id !== i.id))}>Deletar</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {!itens.length && <tr><td colSpan="9">Nada cadastrado.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}

// Botões de abas (ex.: Insumos | Ferramentas | Maquinários)
function Abas({ nomes, render }) {
  const [a, setA] = useState(nomes[0]);
  return (
    <>
      <nav className="abas">
        {nomes.map((n) => (
          <button key={n} className={n === a ? "" : "sec"} onClick={() => setA(n)}>{n}</button>
        ))}
      </nav>
      {render(a)}
    </>
  );
}

// Dados de uma família: Dados pessoais, Participação, Itens recebidos, Produção
function DadosFamilia({ fam, setFam, leitura }) {
  const up = (k) => (v) => setFam({ ...fam, [k]: v });
  const L = (k) => fam[k] || [];
  return (
    <Abas
      nomes={["Dados pessoais", "Lista de participação", "Itens recebidos", "Produção"]}
      render={(a) =>
        a === "Dados pessoais" ? (
          <Crud key={a} titulo={a} somenteLeitura={leitura} itens={L("membros")} onChange={up("membros")}
            campos={[{ k: "nome", l: "Nome" }, { k: "parentesco", l: "Parentesco" }, { k: "nascimento", l: "Nascimento", t: "date" }]} />
        ) : a === "Lista de participação" ? (
          <Crud key={a} titulo={a} somenteLeitura={leitura} itens={L("participacao")} onChange={up("participacao")}
            campos={[{ k: "evento", l: "Evento" }, { k: "presenca", l: "Presença" }]} />
        ) : a === "Itens recebidos" ? (
          <Crud key={a} titulo={a} somenteLeitura={leitura} itens={L("recebidos")} onChange={up("recebidos")}
            campos={[{ k: "item", l: "Item" }, { k: "qtd", l: "Quantidade" }]} />
        ) : (
          <section><h2>Produção</h2><p>{fam.producao}</p></section>
        )
      }
    />
  );
}

// ADM > Famílias: lista, novo, editar, deletar e botão "Membros"
function Familias({ familias, setFamilias }) {
  const [sel, setSel] = useState(null);
  const fam = familias.find((f) => f.id === sel);
  if (fam)
    return (
      <>
        <button className="sec" onClick={() => setSel(null)}>← Voltar</button>
        <h2>Família de {fam.responsavel}</h2>
        <DadosFamilia fam={fam} setFam={(f) => setFamilias(familias.map((x) => (x.id === f.id ? f : x)))} />
      </>
    );
  return (
    <Crud titulo="Famílias" itens={familias} onChange={setFamilias}
      campos={[{ k: "responsavel", l: "Responsável" }, { k: "producao", l: "Produção" }]}
      extra={(f) => <button onClick={() => setSel(f.id)}>Membros</button>} />
  );
}

function Inventario({ inv, setInv, leitura }) {
  const campos = [{ k: "nome", l: "Nome" }, { k: "qtd", l: "Quantidade", t: "number" }];
  return (
    <Abas nomes={["Insumos", "Ferramentas", "Maquinários"]}
      render={(a) => <Crud key={a} titulo={a} campos={campos} itens={inv[a]} somenteLeitura={leitura}
        onChange={(v) => setInv({ ...inv, [a]: v })} />} />
  );
}

function Caixa({ caixa, setCaixa }) {
  const campos = [{ k: "descricao", l: "Descrição" }, { k: "valor", l: "Valor (R$)", t: "number" }];
  return (
    <Abas nomes={["Entradas", "Saídas", "Previsões"]}
      render={(a) => <Crud key={a} titulo={a} campos={campos} itens={caixa[a]}
        onChange={(v) => setCaixa({ ...caixa, [a]: v })} />} />
  );
}

function Login({ entrar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    setErro("");
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha }),
      });
      const d = await r.json();
      if (!r.ok) return setErro(d.detail || "Erro no login");
      // O token (JWT) guarda o papel do usuário: "admin" ou "user"
      const payload = d.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      entrar(JSON.parse(atob(payload)).role);
    } catch {
      setErro("Não consegui falar com a API. Use o modo demonstração abaixo.");
    }
  };

  return (
    <form className="login" onSubmit={enviar}>
      <h1>Login</h1>
      <input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input placeholder="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
      <button>Entrar</button>
      {erro && <p className="erro">{erro}</p>}
      <hr />
      <small>Modo demonstração (sem API):</small>
      <button type="button" className="sec" onClick={() => entrar("admin")}>Entrar como Adm</button>
      <button type="button" className="sec" onClick={() => entrar("user")}>Entrar como User</button>
    </form>
  );
}

export default function App() {
  const [papel, setPapel] = useState(null);
  const [tela, setTela] = useState("");
  const [d, setD] = useState(INICIAL);
  const set = (k) => (v) => setD((x) => ({ ...x, [k]: v }));

  if (!papel)
    return (
      <Login entrar={(p) => { setPapel(p); setTela(p === "admin" ? "Famílias" : "Inventário"); }} />
    );

  const adm = papel === "admin";
  const menu = adm
    ? ["Famílias", "Calendário", "Inventário", "Caixa"]
    : ["Inventário", "Calendário", "Dados familiares"];

  const telas = {
    Famílias: <Familias familias={d.familias} setFamilias={set("familias")} />,
    Calendário: (
      <Crud titulo="Calendário" itens={d.eventos} onChange={set("eventos")} somenteLeitura={!adm}
        campos={[{ k: "titulo", l: "Evento" }, { k: "data", l: "Data", t: "date" }]} />
    ),
    Inventário: <Inventario inv={d.inv} setInv={set("inv")} leitura={!adm} />,
    Caixa: <Caixa caixa={d.caixa} setCaixa={set("caixa")} />,
    "Dados familiares": d.familias[0] ? (
      <DadosFamilia fam={d.familias[0]} leitura />
    ) : (
      <section><p>Nenhuma família cadastrada.</p></section>
    ),
  };

  return (
    <div className={adm ? "app adm" : "app user"}>
      <header>
        <strong>{adm ? "Painel do Administrador" : "Painel principal"}</strong>
        <nav>
          {menu.map((m) => (
            <button key={m} className={m === tela ? "" : "sec"} onClick={() => setTela(m)}>{m}</button>
          ))}
          <button className="perigo" onClick={() => setPapel(null)}>Sair</button>
        </nav>
      </header>
      <main key={tela}>{telas[tela]}</main>
    </div>
  );
}
