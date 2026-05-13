--
-- PostgreSQL database dump
--

\restrict nK9wczHNgQadttpa2jjDScupSK1sQ0GSze0j5SxV34QbmuLVxZJJiydt01g1nVF

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bill_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bill_items (
    item_id integer NOT NULL,
    bill_id integer NOT NULL,
    item_name character varying(255) NOT NULL,
    quantity integer DEFAULT 1,
    unit_price numeric(10,2) NOT NULL,
    total_item_amount numeric(10,2) NOT NULL
);


ALTER TABLE public.bill_items OWNER TO postgres;

--
-- Name: bill_items_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bill_items_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bill_items_item_id_seq OWNER TO postgres;

--
-- Name: bill_items_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bill_items_item_id_seq OWNED BY public.bill_items.item_id;


--
-- Name: bill_line_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bill_line_items (
    id integer NOT NULL,
    bill_id integer NOT NULL,
    description character varying(255) NOT NULL,
    amount numeric(12,2) NOT NULL
);


ALTER TABLE public.bill_line_items OWNER TO postgres;

--
-- Name: bill_line_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bill_line_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bill_line_items_id_seq OWNER TO postgres;

--
-- Name: bill_line_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bill_line_items_id_seq OWNED BY public.bill_line_items.id;


--
-- Name: bills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bills (
    bill_id integer NOT NULL,
    user_id uuid,
    room_id uuid,
    issue_date date NOT NULL,
    due_date date NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'unpaid'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    penalty_stage integer DEFAULT 0
);


ALTER TABLE public.bills OWNER TO postgres;

--
-- Name: bills_bill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bills_bill_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bills_bill_id_seq OWNER TO postgres;

--
-- Name: bills_bill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bills_bill_id_seq OWNED BY public.bills.bill_id;


--
-- Name: blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.blocks OWNER TO postgres;

--
-- Name: community_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.community_rooms (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    fee_code character varying(50) NOT NULL,
    description text,
    image_url text,
    capacity integer DEFAULT 20,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.community_rooms OWNER TO postgres;

--
-- Name: community_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.community_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.community_rooms_id_seq OWNER TO postgres;

--
-- Name: community_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.community_rooms_id_seq OWNED BY public.community_rooms.id;


--
-- Name: fees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fees (
    fee_id integer NOT NULL,
    fee_name character varying(255) NOT NULL,
    fee_code character varying(50) NOT NULL,
    price numeric(10,2) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.fees OWNER TO postgres;

--
-- Name: fees_fee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fees_fee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fees_fee_id_seq OWNER TO postgres;

--
-- Name: fees_fee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fees_fee_id_seq OWNED BY public.fees.fee_id;


--
-- Name: news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now(),
    author_id uuid,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL
);


ALTER TABLE public.news OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    link_to text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: room_bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_bookings (
    id integer NOT NULL,
    resident_id uuid NOT NULL,
    room_id integer,
    booking_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    total_price numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'confirmed'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.room_bookings OWNER TO postgres;

--
-- Name: room_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_bookings_id_seq OWNER TO postgres;

--
-- Name: room_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_bookings_id_seq OWNED BY public.room_bookings.id;


--
-- Name: room_type_policies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_type_policies (
    type_code character varying(10) NOT NULL,
    description character varying(255),
    max_cars integer DEFAULT 1,
    max_motorbikes integer DEFAULT 2,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    max_bicycles integer DEFAULT 2
);


ALTER TABLE public.room_type_policies OWNER TO postgres;

--
-- Name: rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_number character varying(50) NOT NULL,
    floor integer NOT NULL,
    status character varying(50) DEFAULT 'available'::character varying,
    block_id uuid NOT NULL,
    resident_id uuid,
    area numeric(5,2) DEFAULT 0,
    bedrooms integer DEFAULT 1,
    room_type character varying(10) DEFAULT 'A'::character varying
);


ALTER TABLE public.rooms OWNER TO postgres;

--
-- Name: service_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_rates (
    id integer NOT NULL,
    service_name character varying(50) NOT NULL,
    rate numeric(12,2) NOT NULL,
    unit character varying(20) NOT NULL
);


ALTER TABLE public.service_rates OWNER TO postgres;

--
-- Name: service_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_rates_id_seq OWNER TO postgres;

--
-- Name: service_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_rates_id_seq OWNED BY public.service_rates.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    transaction_id integer NOT NULL,
    bill_id integer,
    user_id uuid,
    payment_method character varying(50) DEFAULT 'paypal'::character varying,
    paypal_transaction_id character varying(255),
    amount numeric(10,2) NOT NULL,
    status character varying(20) NOT NULL,
    message text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_transaction_id_seq OWNER TO postgres;

--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_transaction_id_seq OWNED BY public.transactions.transaction_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    apartment_number character varying(20),
    is_verified boolean DEFAULT false,
    verification_token text,
    created_at timestamp with time zone DEFAULT now(),
    password_reset_token text,
    password_reset_expires timestamp with time zone,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    phone_number character varying(20),
    phone character varying(30),
    is_active boolean DEFAULT true,
    last_room_id uuid
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vehicle_card_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_card_requests (
    id integer NOT NULL,
    resident_id uuid NOT NULL,
    request_type character varying(10) NOT NULL,
    target_card_id integer,
    vehicle_type character varying(10) NOT NULL,
    full_name character varying(255) NOT NULL,
    dob date,
    phone character varying(20),
    relationship character varying(100),
    license_plate character varying(20),
    brand character varying(100),
    color character varying(50),
    proof_image_url character varying(255),
    reason text,
    status character varying(10) DEFAULT 'pending'::character varying NOT NULL,
    requested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    admin_notes text,
    one_time_fee_amount numeric(10,2) DEFAULT 0,
    billed_in_bill_id integer,
    CONSTRAINT vehicle_card_requests_request_type_check CHECK (((request_type)::text = ANY ((ARRAY['register'::character varying, 'reissue'::character varying, 'cancel'::character varying])::text[]))),
    CONSTRAINT vehicle_card_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT vehicle_card_requests_vehicle_type_check CHECK (((vehicle_type)::text = ANY ((ARRAY['car'::character varying, 'motorbike'::character varying, 'bicycle'::character varying])::text[])))
);


ALTER TABLE public.vehicle_card_requests OWNER TO postgres;

--
-- Name: vehicle_card_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicle_card_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vehicle_card_requests_id_seq OWNER TO postgres;

--
-- Name: vehicle_card_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicle_card_requests_id_seq OWNED BY public.vehicle_card_requests.id;


--
-- Name: vehicle_cards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_cards (
    id integer NOT NULL,
    resident_id uuid NOT NULL,
    card_user_name character varying(255) NOT NULL,
    vehicle_type character varying(10) NOT NULL,
    license_plate character varying(20),
    brand character varying(100),
    color character varying(50),
    card_identifier character varying(50),
    status character varying(10) DEFAULT 'active'::character varying NOT NULL,
    issued_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp with time zone,
    created_from_request_id integer,
    CONSTRAINT vehicle_cards_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'lost'::character varying, 'canceled'::character varying])::text[]))),
    CONSTRAINT vehicle_cards_vehicle_type_check CHECK (((vehicle_type)::text = ANY ((ARRAY['car'::character varying, 'motorbike'::character varying, 'bicycle'::character varying])::text[])))
);


ALTER TABLE public.vehicle_cards OWNER TO postgres;

--
-- Name: vehicle_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicle_cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vehicle_cards_id_seq OWNER TO postgres;

--
-- Name: vehicle_cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicle_cards_id_seq OWNED BY public.vehicle_cards.id;


--
-- Name: bill_items item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill_items ALTER COLUMN item_id SET DEFAULT nextval('public.bill_items_item_id_seq'::regclass);


--
-- Name: bill_line_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill_line_items ALTER COLUMN id SET DEFAULT nextval('public.bill_line_items_id_seq'::regclass);


--
-- Name: bills bill_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills ALTER COLUMN bill_id SET DEFAULT nextval('public.bills_bill_id_seq'::regclass);


--
-- Name: community_rooms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_rooms ALTER COLUMN id SET DEFAULT nextval('public.community_rooms_id_seq'::regclass);


--
-- Name: fees fee_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fees ALTER COLUMN fee_id SET DEFAULT nextval('public.fees_fee_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: room_bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_bookings ALTER COLUMN id SET DEFAULT nextval('public.room_bookings_id_seq'::regclass);


--
-- Name: service_rates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_rates ALTER COLUMN id SET DEFAULT nextval('public.service_rates_id_seq'::regclass);


--
-- Name: transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.transactions_transaction_id_seq'::regclass);


--
-- Name: vehicle_card_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_card_requests ALTER COLUMN id SET DEFAULT nextval('public.vehicle_card_requests_id_seq'::regclass);


--
-- Name: vehicle_cards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_cards ALTER COLUMN id SET DEFAULT nextval('public.vehicle_cards_id_seq'::regclass);


--
-- Data for Name: bill_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bill_items (item_id, bill_id, item_name, quantity, unit_price, total_item_amount) FROM stdin;
1	1	Apartment Management Fee (11/2025)	1	500000.00	500000.00
2	1	Admin Fee (11/2025)	1	150000.00	150000.00
3	2	Apartment Management Fee (11/2025)	1	500000.00	500000.00
4	2	Admin Fee (11/2025)	1	150000.00	150000.00
5	3	Apartment Management Fee (11/2025)	1	500000.00	500000.00
6	3	Admin Fee (11/2025)	1	150000.00	150000.00
7	4	Apartment Management Fee (11/2025)	1	500000.00	500000.00
8	4	Admin Fee (11/2025)	1	150000.00	150000.00
9	5	Apartment Management Fee (11/2025)	1	500000.00	500000.00
10	5	Admin Fee (11/2025)	1	150000.00	150000.00
11	5	Car Parking Fee (x2)	1	2000000.00	2000000.00
12	6	Apartment Management Fee (11/2025)	1	500000.00	500000.00
13	6	Admin Fee (11/2025)	1	150000.00	150000.00
14	6	Bicycle Parking Fee (x2)	1	200000.00	200000.00
15	6	Car Parking Fee (x1)	1	1000000.00	1000000.00
16	6	Motorbike Parking Fee (x1)	1	300000.00	300000.00
17	6	Car Parking (Prorated 10/2025: 1/30 days)	1	33333.00	33333.00
18	6	Car Parking (Prorated 10/2025: 1/30 days)	1	33333.00	33333.00
19	6	Motorbike Parking (Prorated 10/2025: 1/30 days)	1	10000.00	10000.00
20	7	Apartment Management Fee (11/2025)	1	500000.00	500000.00
21	7	Admin Fee (11/2025)	1	150000.00	150000.00
22	8	Apartment Management Fee (11/2025)	1	500000.00	500000.00
23	8	Admin Fee (11/2025)	1	150000.00	150000.00
24	9	Apartment Management Fee (11/2025)	1	500000.00	500000.00
25	9	Admin Fee (11/2025)	1	150000.00	150000.00
26	10	Apartment Management Fee (11/2025)	1	500000.00	500000.00
27	10	Admin Fee (11/2025)	1	150000.00	150000.00
28	11	Apartment Management Fee (11/2025)	1	500000.00	500000.00
29	11	Admin Fee (11/2025)	1	150000.00	150000.00
30	12	Apartment Management Fee (11/2025)	1	500000.00	500000.00
31	12	Admin Fee (11/2025)	1	150000.00	150000.00
32	13	Apartment Management Fee (11/2025)	1	500000.00	500000.00
33	13	Admin Fee (11/2025)	1	150000.00	150000.00
34	14	Apartment Management Fee (11/2025)	1	500000.00	500000.00
35	14	Admin Fee (11/2025)	1	150000.00	150000.00
36	15	Apartment Management Fee (11/2025)	1	500000.00	500000.00
37	15	Admin Fee (11/2025)	1	150000.00	150000.00
38	16	Apartment Management Fee (11/2025)	1	500000.00	500000.00
39	16	Admin Fee (11/2025)	1	150000.00	150000.00
40	17	Apartment Management Fee (11/2025)	1	500000.00	500000.00
41	17	Admin Fee (11/2025)	1	150000.00	150000.00
42	18	Apartment Management Fee (11/2025)	1	500000.00	500000.00
43	18	Admin Fee (11/2025)	1	150000.00	150000.00
44	19	Apartment Management Fee (11/2025)	1	500000.00	500000.00
45	19	Admin Fee (11/2025)	1	150000.00	150000.00
46	20	Management Fee (Move-in Prorated: 6/30 days)	1	100000.00	100000.00
47	20	Admin Fee (Move-in Prorated: 6/30 days)	1	30000.00	30000.00
48	21	Management Fee (Move-in Prorated: 6/30 days)	1	100000.00	100000.00
49	21	Admin Fee (Move-in Prorated: 6/30 days)	1	30000.00	30000.00
50	22	Management Fee (Move-in Prorated: 6/30 days)	1	100000.00	100000.00
51	22	Admin Fee (Move-in Prorated: 6/30 days)	1	30000.00	30000.00
52	23	Management Fee (Move-in Prorated: 6/30 days)	1	100000.00	100000.00
53	23	Admin Fee (Move-in Prorated: 6/30 days)	1	30000.00	30000.00
56	1	Late Payment Fee	1	100000.00	100000.00
57	2	Late Payment Fee	1	100000.00	100000.00
58	3	Late Payment Fee	1	100000.00	100000.00
59	4	Late Payment Fee	1	100000.00	100000.00
60	7	Late Payment Fee	1	100000.00	100000.00
61	8	Late Payment Fee	1	100000.00	100000.00
62	9	Late Payment Fee	1	100000.00	100000.00
63	10	Late Payment Fee	1	100000.00	100000.00
64	11	Late Payment Fee	1	100000.00	100000.00
65	12	Late Payment Fee	1	100000.00	100000.00
66	13	Late Payment Fee	1	100000.00	100000.00
67	14	Late Payment Fee	1	100000.00	100000.00
68	15	Late Payment Fee	1	100000.00	100000.00
69	16	Late Payment Fee	1	100000.00	100000.00
70	17	Late Payment Fee	1	100000.00	100000.00
71	18	Late Payment Fee	1	100000.00	100000.00
72	19	Late Payment Fee	1	100000.00	100000.00
73	6	Late Payment Fee	1	100000.00	100000.00
74	24	Apartment Management Fee (45m┬▓ x 7.000 VND)	1	315000.00	315000.00
75	24	Admin Fee (12/2025)	1	150000.00	150000.00
76	24	Car Parking Fee (x1)	1	1000000.00	1000000.00
77	24	Card Registration Fee (Car)	1	200000.00	200000.00
78	24	Card Registration Fee (Car)	1	200000.00	200000.00
79	24	Car Parking (Prorated 11/2025: 12/29 days)	1	413793.00	413793.00
80	24	Car Parking (Prorated 11/2025: 12/29 days)	1	413793.00	413793.00
81	25	Apartment Management Fee (45m┬▓ x 7.000 VND)	1	315000.00	315000.00
82	25	Admin Fee (12/2025)	1	150000.00	150000.00
83	26	Apartment Management Fee (45m┬▓ x 7.000 VND)	1	315000.00	315000.00
84	26	Admin Fee (12/2025)	1	150000.00	150000.00
85	27	Apartment Management Fee (45m┬▓ x 7.000 VND)	1	315000.00	315000.00
86	27	Admin Fee (12/2025)	1	150000.00	150000.00
87	28	Apartment Management Fee (45m┬▓ x 7.000 VND)	1	315000.00	315000.00
88	28	Admin Fee (12/2025)	1	150000.00	150000.00
89	29	Apartment Management Fee (45m┬▓ x 7.000 VND)	1	315000.00	315000.00
90	29	Admin Fee (12/2025)	1	150000.00	150000.00
91	30	Apartment Management Fee (70m┬▓ x 7.000 VND)	1	490000.00	490000.00
92	30	Admin Fee (12/2025)	1	150000.00	150000.00
93	31	Apartment Management Fee (70m┬▓ x 7.000 VND)	1	490000.00	490000.00
94	31	Admin Fee (12/2025)	1	150000.00	150000.00
95	32	Apartment Management Fee (70m┬▓ x 7.000 VND)	1	490000.00	490000.00
96	32	Admin Fee (12/2025)	1	150000.00	150000.00
97	33	Apartment Management Fee (70m┬▓ x 7.000 VND)	1	490000.00	490000.00
98	33	Admin Fee (12/2025)	1	150000.00	150000.00
99	34	Apartment Management Fee (70m┬▓ x 7.000 VND)	1	490000.00	490000.00
100	34	Admin Fee (12/2025)	1	150000.00	150000.00
101	35	Apartment Management Fee (70m┬▓ x 7.000 VND)	1	490000.00	490000.00
102	35	Admin Fee (12/2025)	1	150000.00	150000.00
103	36	Apartment Management Fee (70m┬▓ x 7.000 VND)	1	490000.00	490000.00
104	36	Admin Fee (12/2025)	1	150000.00	150000.00
105	37	Apartment Management Fee (70m┬▓ x 7.000 VND)	1	490000.00	490000.00
106	37	Admin Fee (12/2025)	1	150000.00	150000.00
107	37	Bicycle Parking Fee (x2)	1	200000.00	200000.00
108	37	Car Parking Fee (x1)	1	1000000.00	1000000.00
109	37	Motorbike Parking Fee (x1)	1	200000.00	200000.00
110	37	Card Registration Fee (Motorbike)	1	100000.00	100000.00
111	37	Bicycle Parking (Prorated 11/2025: 20/29 days)	1	68966.00	68966.00
112	37	Bicycle Parking (Prorated 11/2025: 20/29 days)	1	68966.00	68966.00
113	37	Motorbike Parking (Prorated 11/2025: 20/29 days)	1	137931.00	137931.00
114	37	Car Parking (Prorated 11/2025: 19/29 days)	1	655172.00	655172.00
115	37	Motorbike Parking (Prorated 11/2025: 18/29 days)	1	124138.00	124138.00
116	38	Apartment Management Fee (70m┬▓ x 7.000 VND)	1	490000.00	490000.00
117	38	Admin Fee (12/2025)	1	150000.00	150000.00
118	39	Apartment Management Fee (70m┬▓ x 7.000 VND)	1	490000.00	490000.00
119	39	Admin Fee (12/2025)	1	150000.00	150000.00
120	40	Apartment Management Fee (70m┬▓ x 7.000 VND)	1	490000.00	490000.00
121	40	Admin Fee (12/2025)	1	150000.00	150000.00
122	41	Management Fee (Prorated 28 days for 45m┬▓)	1	284516.00	284516.00
123	41	Admin Fee (Move-in Prorated: 28/31 days)	1	135484.00	135484.00
124	42	Management Fee (Prorated 15 days for 70m┬▓)	1	237097.00	237097.00
125	42	Admin Fee (Move-in Prorated: 15/31 days)	1	72581.00	72581.00
\.


--
-- Data for Name: bill_line_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bill_line_items (id, bill_id, description, amount) FROM stdin;
76	36	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
77	36	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
78	37	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
79	37	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
80	38	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
81	38	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
82	39	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
83	39	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
84	40	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
85	40	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
86	41	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
87	41	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
88	41	Ph├¡ gß╗¡i xe M├íy (x1)	100000.00
89	42	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
90	42	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
91	43	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
92	43	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
93	44	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
94	44	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
95	45	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
96	45	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
97	46	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
98	46	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
99	47	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
100	47	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
101	48	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
102	48	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
103	48	Ph├¡ gß╗¡i xe ├ö t├┤ (x1)	500000.00
104	48	Ph├¡ gß╗¡i xe ├ö t├┤ (Tß╗╖ lß╗ç T10: 2/31 ng├áy)	32258.00
105	48	Ph├¡ gß╗¡i xe ├ö t├┤ (Tß╗╖ lß╗ç T10: 2/31 ng├áy)	32258.00
106	48	Ph├¡ gß╗¡i xe Xe m├íy (Tß╗╖ lß╗ç T10: 2/31 ng├áy)	6452.00
107	48	Ph├¡ gß╗¡i xe ├ö t├┤ (Tß╗╖ lß╗ç T10: 1/31 ng├áy)	16129.00
108	49	Ph├¡ quß║ún l├╜ c─ân hß╗Ö	500000.00
109	49	Ph├¡ Ban Quß║ún Trß╗ï	5000.00
\.


--
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bills (bill_id, user_id, room_id, issue_date, due_date, total_amount, status, notes, created_at, updated_at, penalty_stage) FROM stdin;
31	4b04408d-6bd7-4436-91fd-b65716f2f563	4869c80e-f2d0-4797-a6de-e002faa6b823	2025-12-01	2025-12-10	640000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
5	c2f026a4-2766-4487-a5d4-f75c2306546a	1997f1f7-47f9-49c3-bcdf-7a053f67c856	2025-11-01	2025-11-10	2650000.00	paid	\N	2025-11-19 21:02:27.283041+07	2025-11-21 13:49:22.775382+07	0
21	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	534917e2-2c5c-4fcc-b13c-23f652f104b5	2025-11-25	2025-11-30	130000.00	unpaid	\N	2025-11-25 16:30:45.623278+07	2025-11-25 16:30:45.623278+07	0
22	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	7ff3f4aa-0c07-4721-b9c7-7dc863873b10	2025-11-25	2025-11-30	130000.00	unpaid	\N	2025-11-25 16:32:00.021012+07	2025-11-25 16:32:00.021012+07	0
23	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	7ff3f4aa-0c07-4721-b9c7-7dc863873b10	2025-11-25	2025-11-30	130000.00	unpaid	\N	2025-11-25 16:35:16.42437+07	2025-11-25 16:35:16.42437+07	0
20	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	7ff3f4aa-0c07-4721-b9c7-7dc863873b10	2025-11-25	2025-11-30	130000.00	paid	\N	2025-11-25 16:09:07.728286+07	2025-11-25 16:45:46.974886+07	0
32	d014c4de-0211-48f5-89de-be4c9c36959e	b6424d83-375d-44ff-ad36-5ffa17791511	2025-12-01	2025-12-10	640000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
33	ce04e770-7d67-4082-a462-61d404c6a660	bdee13ee-5962-48b0-b276-f4f0a0fb735d	2025-12-01	2025-12-10	640000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
34	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	7ff3f4aa-0c07-4721-b9c7-7dc863873b10	2025-12-01	2025-12-10	640000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
35	8426b9e7-d550-4696-b5ce-e1e66f6a8585	a57c5eab-6641-4aed-82d0-caf3bedb121d	2025-12-01	2025-12-10	640000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
36	df9d80bc-f95b-430c-b3f7-0aec87e9314a	9f29bc87-ca7a-4291-8f14-f97791a5765d	2025-12-01	2025-12-10	640000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
1	8426b9e7-d550-4696-b5ce-e1e66f6a8585	a57c5eab-6641-4aed-82d0-caf3bedb121d	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-19 21:02:27.283041+07	2025-11-26 14:52:29.737756+07	0
2	4b04408d-6bd7-4436-91fd-b65716f2f563	4869c80e-f2d0-4797-a6de-e002faa6b823	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-19 21:02:27.283041+07	2025-11-26 14:52:29.737756+07	0
3	80388e96-6204-41cf-b510-31e55b9df889	37533a34-f0d6-47dc-ab7e-fb9a686efa6c	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-19 21:02:27.283041+07	2025-11-26 14:52:29.737756+07	0
4	323b184f-b460-48c2-bfda-5bca9943556d	6f4f905a-230f-4caf-83ee-6fbc13d0de9f	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-19 21:02:27.283041+07	2025-11-26 14:52:29.737756+07	0
7	c339e72b-6acd-4367-8943-64c2836129c5	52225ab3-be6a-4a65-9f45-7efd0028a8a6	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-19 21:02:27.283041+07	2025-11-26 14:52:29.737756+07	0
8	df9d80bc-f95b-430c-b3f7-0aec87e9314a	9f29bc87-ca7a-4291-8f14-f97791a5765d	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-19 21:02:27.283041+07	2025-11-26 14:52:29.737756+07	0
9	f1484565-6580-4e47-83d5-564b464edcc8	90a18a05-e954-4b37-8559-de7e7a3c237d	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-19 21:02:27.283041+07	2025-11-26 14:52:29.737756+07	0
10	8ac0483d-450e-4c3a-8083-3fb895f7935b	d433b93c-abf9-4fcd-8c19-cbed525c3bdb	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-19 21:11:38.608649+07	2025-11-26 14:52:29.737756+07	0
11	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	fb5d85c7-99ed-4aec-a4a7-d156dd0e6ecd	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-21 16:27:18.969104+07	2025-11-26 14:52:29.737756+07	0
12	6f4487dc-4660-4ebc-94e3-4b169b3a5686	b399fcc5-58b4-41fb-955a-d700d47b5151	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-21 16:27:18.969104+07	2025-11-26 14:52:29.737756+07	0
13	f2404ee1-ba9e-453c-9f2d-83318b5e2106	8361ec3f-2be4-4194-8318-c25c8bc1a611	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-21 16:27:18.969104+07	2025-11-26 14:52:29.737756+07	0
14	d014c4de-0211-48f5-89de-be4c9c36959e	b6424d83-375d-44ff-ad36-5ffa17791511	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-21 16:27:18.969104+07	2025-11-26 14:52:29.737756+07	0
15	c7dc3940-a243-41af-9e8a-1fa454af1f87	fe92608c-9284-428e-9af2-e470cd5d63f3	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-21 16:27:18.969104+07	2025-11-26 14:52:29.737756+07	0
16	8ac0483d-450e-4c3a-8083-3fb895f7935b	5930bbd5-d3e1-403d-be17-a0d7796a4828	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-21 16:27:18.969104+07	2025-11-26 14:52:29.737756+07	0
17	ce04e770-7d67-4082-a462-61d404c6a660	bdee13ee-5962-48b0-b276-f4f0a0fb735d	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-21 16:27:18.969104+07	2025-11-26 14:52:29.737756+07	0
18	c339e72b-6acd-4367-8943-64c2836129c5	ac713861-8388-49bc-97a6-54b5ef858fd5	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-21 16:27:18.969104+07	2025-11-26 14:52:29.737756+07	0
19	80388e96-6204-41cf-b510-31e55b9df889	ace4d375-5dcd-477d-8db7-d36b7604834e	2025-11-01	2025-11-10	750000.00	overdue	\N	2025-11-21 16:27:18.969104+07	2025-11-26 14:52:29.737756+07	0
37	1fbe7162-51de-4ddb-b583-d806d9e2d40c	d5da0afd-a8dd-4e88-b4b5-894121cd0e79	2025-12-01	2025-12-10	3195173.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
6	1fbe7162-51de-4ddb-b583-d806d9e2d40c	d5da0afd-a8dd-4e88-b4b5-894121cd0e79	2025-11-01	2025-11-21	600000.00	paid	\N	2025-11-19 21:02:27.283041+07	2025-11-26 15:06:07.074747+07	0
25	80388e96-6204-41cf-b510-31e55b9df889	ace4d375-5dcd-477d-8db7-d36b7604834e	2025-12-01	2025-12-10	465000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
26	c7dc3940-a243-41af-9e8a-1fa454af1f87	fe92608c-9284-428e-9af2-e470cd5d63f3	2025-12-01	2025-12-10	465000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
27	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	fb5d85c7-99ed-4aec-a4a7-d156dd0e6ecd	2025-12-01	2025-12-10	465000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
28	6f4487dc-4660-4ebc-94e3-4b169b3a5686	b399fcc5-58b4-41fb-955a-d700d47b5151	2025-12-01	2025-12-10	465000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
29	8ac0483d-450e-4c3a-8083-3fb895f7935b	5930bbd5-d3e1-403d-be17-a0d7796a4828	2025-12-01	2025-12-10	465000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
30	323b184f-b460-48c2-bfda-5bca9943556d	6f4f905a-230f-4caf-83ee-6fbc13d0de9f	2025-12-01	2025-12-10	640000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
38	f1484565-6580-4e47-83d5-564b464edcc8	90a18a05-e954-4b37-8559-de7e7a3c237d	2025-12-01	2025-12-10	640000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
39	f2404ee1-ba9e-453c-9f2d-83318b5e2106	8361ec3f-2be4-4194-8318-c25c8bc1a611	2025-12-01	2025-12-10	640000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
40	c339e72b-6acd-4367-8943-64c2836129c5	ac713861-8388-49bc-97a6-54b5ef858fd5	2025-12-01	2025-12-10	640000.00	unpaid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 10:20:43.999182+07	0
24	c2f026a4-2766-4487-a5d4-f75c2306546a	2975b956-550e-44fb-8e23-da99b1fdcf13	2025-12-01	2025-12-10	2692586.00	paid	\N	2025-12-03 10:20:43.999182+07	2025-12-03 22:19:33.726232+07	0
41	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	4dd58648-cd86-499c-a22b-7f61a6dd9ffb	2025-12-04	2025-12-09	420000.00	unpaid	\N	2025-12-04 15:14:28.95311+07	2025-12-04 15:14:28.95311+07	0
42	33d3a768-1c01-4385-acc6-b3c2f505ec6d	c09a62aa-4154-4c9a-8f8c-b8c914be091d	2025-12-17	2025-12-22	309678.00	paid	\N	2025-12-17 11:33:40.694848+07	2025-12-18 17:26:37.898436+07	0
\.


--
-- Data for Name: blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blocks (id, name) FROM stdin;
83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	A
01c61932-b7c2-4af8-ab2c-c4e291d35c6b	B
45d7b9f6-4402-4df8-b6c7-fb3cbc758391	C
\.


--
-- Data for Name: community_rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.community_rooms (id, name, fee_code, description, image_url, capacity, status, created_at) FROM stdin;
1	Community Room A	ROOM_A_FEE		https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop	30	active	2025-11-17 11:29:37.206893
2	Community Room B	ROOM_B_FEE		https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1000&auto=format&fit=crop	15	active	2025-11-17 11:29:37.206893
3	Community Room C	ROOM_C_FEE		https://images.unsplash.com/photo-1727768525315-7c8aedb5077c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D	20	active	2025-11-17 11:29:37.206893
\.


--
-- Data for Name: fees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fees (fee_id, fee_name, fee_code, price, description, created_at, updated_at) FROM stdin;
2	Admin Fee	ADMIN_FEE	150000.00		2025-11-11 17:11:31.678901+07	2025-11-11 19:11:51.842759+07
5	Car Parking Fee	CAR_FEE	1000000.00		2025-11-11 19:11:07.044527+07	2025-11-11 19:12:03.029529+07
6	Bicycle Parking Fee	BICYCLE_FEE	100000.00		2025-11-11 19:12:23.184726+07	2025-11-11 19:12:23.184726+07
8	Car Card Fee	CAR_CARD_FEE	200000.00		2025-11-12 09:58:08.171582+07	2025-11-12 09:58:08.171582+07
10	Motorbike Card Fee	MOTORBIKE_CARD_FEE	100000.00		2025-11-12 10:43:52.796382+07	2025-11-12 10:43:52.796382+07
9	Bicycle Card Fee	BICYCLE_CARD_FEE	50000.00		2025-11-12 09:58:49.125514+07	2025-11-12 09:58:49.125514+07
11	Room A Fee	ROOM_A_FEE	100000.00		2025-11-17 10:54:54.363166+07	2025-11-19 21:25:21.007757+07
13	Room C Fee	ROOM_C_FEE	300000.00		2025-11-17 10:54:54.363166+07	2025-11-19 21:25:57.413698+07
12	Room B Fee	ROOM_B_FEE	150000.00		2025-11-17 10:54:54.363166+07	2025-11-19 21:31:47.208897+07
3	Motorbike Parking Fee	MOTORBIKE_FEE	200000.00		2025-11-11 17:11:31.678901+07	2025-11-20 22:09:06.837422+07
7	Late Payment Fee	LATE_PAYMENT_FEE	100000.00		2025-11-11 19:12:49.949101+07	2025-11-26 11:05:48.50791+07
1	Management Fee (per m2)	MANAGEMENT_FEE	7000.00	Calculated based on apartment area (7,000 VND/m2)	2025-11-11 17:11:31.678901+07	2025-11-11 19:11:55.993208+07
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.news (id, title, content, image_url, created_at, author_id, status) FROM stdin;
b399b797-1153-4a4c-8968-9cda9f2c5d74	The Ho Chi Minh City Department of Construction is considering adding regulations on short-term stays in apartment units.	<p>The Ho Chi Minh City Department of Construction has just submitted a report to the City PeopleΓÇÖs Committee on implementing a short-term rental model in apartment buildings, while also proposing to continue studying and refining the management regulations for this type of activity.</p><p>Previously, the City PeopleΓÇÖs Committee assigned the Department of Construction to take the lead in developing a framework related to short-term stays in apartments and to advise the Committee before November 15, 2025.</p><p>To carry out this task, the Department has coordinated with relevant agencies to draft guidelines on the conditions for using apartments for tourist accommodation. It has also worked with the Ho Chi Minh City Police and the PeopleΓÇÖs Committees of wards and communes to review and publish a list of apartment buildings with units eligible for short-term rentals.</p>	/uploads/proofs/image-1763907642160-203107772.jpg	2025-11-13 21:56:43.502199+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	active
e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	Consultation on the PG Aura An ─Éß╗ông Apartment Project, Hai Phong.	<p>Description Information</p><p>CONSULTATION on the PG Aura An ─Éß╗ông Apartment Project in Hai Phong at the original price from the Investor.</p><ul><li>Contact the Sales Office Hotline: 0369 863 ***.</li><li>Overview of the PG An ─Éß╗ông Apartment Project:</li><li>Investor: PG Investment &amp; Construction JSC.</li><li>Project location: Nguyß╗àn V─ân Linh, An ─Éß╗ông, An D╞░╞íng, Hai Phong.</li><li>Number of floors: 23 floors.</li><li>Total area: 6,288.7 m┬▓.</li><li>Total number of apartments: 775 units.</li><li>Apartment sizes: 50ΓÇô77 m┬▓.</li><li>Legal status: Individual pink book (ownership certificate) for each unit.</li><li>Sale price: Contact 0369 863 *** for details.</li><li>Expected handover: Q4/2025.</li><li>Status: About to launch.</li><li>Location of PG An ─Éß╗ông Apartment, Hai Phong:</li><li>PG Apartment is located in the PG An ─Éß╗ông urban area, just 200m from Nguyß╗àn V─ân Linh Street.</li><li>With this prime location, residents can easily reach the city center in just 5 minutes via Nguyß╗àn V─ân Linh ΓÇô An ─Éß╗ông Bridge ΓÇô L├ín B├¿ or Nguyß╗àn V─ân Linh ΓÇô An Trang ΓÇô An D╞░╞íng Bridge.</li><li>Additionally, when the World Bank road project is completed, Nguyß╗àn V─ân Linh will be developed as an inner-city road, reducing truck and container traffic and increasing the value of PG An ─Éß╗ông apartments.</li><li>Notably, connection to Aeon Mall takes only 8 minutes by car via Nguyß╗àn V─ân Linh Street.</li></ul><p><br></p>	https://file4.batdongsan.com.vn/crop/600x315/2024/07/04/20240704103020-ea5e_wm.jpg	2025-11-13 21:56:29.901498+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	active
5a2fd606-ea9b-485e-a147-efe358c6f2e1	New Skyline	<p>Overview</p><p> Project Information: New Skyline</p><p>New Skyline is built on the CC2 plot of the Van Quan New Urban Area. Designed by RDC Consulting (Singapore), the New Skyline complex features twin towers with a 6-story podium that serves as office space, a shopping center, and entertainment facilities.</p><p>Notably, the two towers of the New Skyline apartment project have open connecting floors on the 7th, 15th, and 36th levels, offering a fresh, modern lifestyle. The 15th floor also includes sports and community activity areas, hanging gardens, two spacious basement parking levels, and 1,794.57 m┬▓ allocated for corridors and garden space within the complex.</p><ul><li>Project name: New Skyline</li><li>Investor: Housing and Urban Development Corporation (HUD)</li><li>Consultants: RDC Consulting (Singapore), University of Civil Engineering Consulting, HUD-CIC Investment and Construction Consulting JSC</li><li>Land area: 7,500 m┬▓</li><li>Total floor area: 85,000 m┬▓</li><li>Number of apartments: 380 units</li><li>Groundbreaking: June 2009</li><li>Expected completion: Q3 2013</li></ul><p><br></p>	/uploads/proofs/image-1763907284588-790080688.jpg	2025-11-23 21:14:47.154429+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	active
86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	Experts forecast that apartment prices are currently too high and may have peaked.	<p>How to lower apartment prices?</p><p>To bring apartment prices down sooner, Mr. Nguyß╗àn V─ân ─É├¡nh ΓÇô Chairman of the Vietnam Association of Real Estate Brokers (VARS) ΓÇô believes it is necessary to accelerate the progress of social housing projects. Authorities should actively regulate supply by effectively using tools such as planning and zoning adjustments, and by allocating more clean land to help investors launch social housing projects as soon as plans are made.</p><p class="ql-align-justify">In the long term, stabilizing apartment prices in particular, and housing products in general, requires strong involvement from the State. This includes continuing to develop transportation infrastructure to reduce travel time from satellite areas to the city center, as increased supply from suburban areas will help lower housing prices.</p>	/uploads/proofs/image-1763907143801-2094777.jpg	2025-11-21 10:46:06.68977+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	active
4a895ad3-6e95-427b-b0cf-1a9d571a690a	Da Nang adjusts compensation and resettlement plans for two apartment complexes.	<p>Deputy Chairman of Da Nang City PeopleΓÇÖs Committee, L├¬ Quang Nam, has just signed decisions approving adjustments to the compensation, support, and resettlement plans for the Thuan Phuoc Apartment Complex (Hai Chau Ward) and the Hoa Minh Apartment Complex (Thanh Khe Ward). Accordingly, the city has introduced two new resettlement options to ensure residentsΓÇÖ rights and stable housing.</p><p>Under Option 1, residents will continue to be provided by the State with a rental apartment in social housing owned by the city. The allocated apartment will have a usable area equal to or larger than the apartment the residents are currently renting.</p><p class="ql-align-justify">Option 2 allows residents to purchase a social housing apartment from projects funded by non-state capital in the area. The projects available include: social housing in the An Hoa Residential Area (Sun Home, Son Tra Ward); the social housing project on the Hoa Minh Apartment Complex land (Thanh Khe Ward); social housing on plot No. 10 Trinh Cong Son Street (Hoa Cuong Ward); or other ongoing social housing projects.</p>	/uploads/proofs/image-1763907486332-632418195.jpg	2025-11-13 21:57:08.590113+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	active
b49bd054-6bc5-4219-ab09-2763b8eafe03	Continue studying and collecting opinions on the use of apartment units for short-term rental purposes.	<p>Regarding practical considerations, Mr. Trß║ºn S─⌐ Nam noted that there are two opposing viewpoints: one from owners who are directly living in their apartments and the apartment management boards, and the other from owners who are using their units for short-term tourist rentals. Some opinions oppose the proposal to allow pilot programs by the Department of Construction, as well as any adjustments to current regulations related to short-term rental activities in apartment buildings. In fact, some have suggested that the City PeopleΓÇÖs Committee maintain the regulations in Decision No. 26/2025 and continue to strictly ΓÇ£prohibitΓÇ¥ the use of residential apartments as short-term accommodation under any form. They also recommend that authorities strengthen inspections and strictly handle cases of apartments being used as short-term rental facilities in violation of the rules.</p><p><br></p>	/uploads/proofs/image-1763907538989-911570485.jpg	2025-11-13 21:56:59.178481+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	active
21d08ceb-3e16-4c62-8672-52c17948ee16	Da Nang: FPT Plaza 4 apartment complex is allowed to offer over 1,390 units to the market.	<p><em>The Da Nang Department of Construction has just provided information regarding the conditions for selling off-plan apartments in the FPT Plaza 4 apartment building within the FPT City Technology Urban Area.</em></p><p><em>The FPT Plaza 4 Apartment Building project, located in the B5-3 area of the FPT City Technology Urban Area in Ngu Hanh Son Ward (Da Nang City), is developed by FPT Da Nang Urban Joint Stock Company.</em></p><p class="ql-align-justify"><em>The project covers a land area of 18,905 m┬▓; the construction includes 3 basement levels, 20 above-ground floors, and an attic floor, with a building footprint of 8,129 m┬▓. The project consists of 1,395 apartments, a total residential floor area of 103,584.9 m┬▓, and a commercial-service floor area of 1,865.8 m┬▓.</em></p>	/uploads/proofs/image-1763907403252-244911427.jpg	2025-11-23 21:16:45.854349+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	active
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, message, link_to, is_read, created_at) FROM stdin;
14	d014c4de-0211-48f5-89de-be4c9c36959e	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
15	6f4487dc-4660-4ebc-94e3-4b169b3a5686	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
16	f2404ee1-ba9e-453c-9f2d-83318b5e2106	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
17	8426b9e7-d550-4696-b5ce-e1e66f6a8585	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
18	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
19	4b04408d-6bd7-4436-91fd-b65716f2f563	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
20	80388e96-6204-41cf-b510-31e55b9df889	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
21	ce04e770-7d67-4082-a462-61d404c6a660	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
22	c7dc3940-a243-41af-9e8a-1fa454af1f87	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
23	323b184f-b460-48c2-bfda-5bca9943556d	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
25	f1484565-6580-4e47-83d5-564b464edcc8	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
26	8ac0483d-450e-4c3a-8083-3fb895f7935b	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
27	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
28	c339e72b-6acd-4367-8943-64c2836129c5	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
29	df9d80bc-f95b-430c-b3f7-0aec87e9314a	Tin tß╗⌐c mß╗¢i: Gay...	/news/d243eb5e-4bb1-4de7-93b0-85129f0fa40a	f	2025-11-12 16:27:16.453732+07
31	d014c4de-0211-48f5-89de-be4c9c36959e	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
32	6f4487dc-4660-4ebc-94e3-4b169b3a5686	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
33	f2404ee1-ba9e-453c-9f2d-83318b5e2106	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
34	8426b9e7-d550-4696-b5ce-e1e66f6a8585	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
35	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
36	4b04408d-6bd7-4436-91fd-b65716f2f563	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
37	80388e96-6204-41cf-b510-31e55b9df889	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
38	ce04e770-7d67-4082-a462-61d404c6a660	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
157	8ac0483d-450e-4c3a-8083-3fb895f7935b	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
158	ce04e770-7d67-4082-a462-61d404c6a660	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
159	c7dc3940-a243-41af-9e8a-1fa454af1f87	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
161	c339e72b-6acd-4367-8943-64c2836129c5	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
162	df9d80bc-f95b-430c-b3f7-0aec87e9314a	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
163	f1484565-6580-4e47-83d5-564b464edcc8	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
160	1fbe7162-51de-4ddb-b583-d806d9e2d40c	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	t	2025-11-21 10:46:06.708136+07
305	8426b9e7-d550-4696-b5ce-e1e66f6a8585	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
306	d5f9562e-b42c-4683-8519-5575613cbe9b	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
307	4b04408d-6bd7-4436-91fd-b65716f2f563	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
308	323b184f-b460-48c2-bfda-5bca9943556d	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
309	1f34a886-e578-4062-b6e2-dfde319ef78f	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
310	1a9ddec2-aa43-441f-a504-b4a0c8d54e33	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
311	1fbe7162-51de-4ddb-b583-d806d9e2d40c	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
312	33d3a768-1c01-4385-acc6-b3c2f505ec6d	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
313	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
314	6f4487dc-4660-4ebc-94e3-4b169b3a5686	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
39	c7dc3940-a243-41af-9e8a-1fa454af1f87	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
40	323b184f-b460-48c2-bfda-5bca9943556d	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
42	f1484565-6580-4e47-83d5-564b464edcc8	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
43	8ac0483d-450e-4c3a-8083-3fb895f7935b	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
44	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
45	c339e72b-6acd-4367-8943-64c2836129c5	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
46	df9d80bc-f95b-430c-b3f7-0aec87e9314a	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b66cb132-6c77-40b4-a018-ccb34446339d	f	2025-11-13 21:39:14.4239+07
48	d014c4de-0211-48f5-89de-be4c9c36959e	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
49	6f4487dc-4660-4ebc-94e3-4b169b3a5686	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
50	f2404ee1-ba9e-453c-9f2d-83318b5e2106	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
51	8426b9e7-d550-4696-b5ce-e1e66f6a8585	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
52	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
53	4b04408d-6bd7-4436-91fd-b65716f2f563	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
54	80388e96-6204-41cf-b510-31e55b9df889	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
55	ce04e770-7d67-4082-a462-61d404c6a660	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
56	c7dc3940-a243-41af-9e8a-1fa454af1f87	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
57	323b184f-b460-48c2-bfda-5bca9943556d	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
59	f1484565-6580-4e47-83d5-564b464edcc8	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
60	8ac0483d-450e-4c3a-8083-3fb895f7935b	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
61	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
62	c339e72b-6acd-4367-8943-64c2836129c5	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
63	df9d80bc-f95b-430c-b3f7-0aec87e9314a	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/e3402b61-4b1c-49ee-a7e1-d9a07b2ee8ad	f	2025-11-13 21:56:29.920685+07
65	d014c4de-0211-48f5-89de-be4c9c36959e	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
66	6f4487dc-4660-4ebc-94e3-4b169b3a5686	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
67	f2404ee1-ba9e-453c-9f2d-83318b5e2106	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
68	8426b9e7-d550-4696-b5ce-e1e66f6a8585	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
69	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
70	4b04408d-6bd7-4436-91fd-b65716f2f563	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
71	80388e96-6204-41cf-b510-31e55b9df889	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
72	ce04e770-7d67-4082-a462-61d404c6a660	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
73	c7dc3940-a243-41af-9e8a-1fa454af1f87	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
74	323b184f-b460-48c2-bfda-5bca9943556d	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
76	f1484565-6580-4e47-83d5-564b464edcc8	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
77	8ac0483d-450e-4c3a-8083-3fb895f7935b	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
78	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
79	c339e72b-6acd-4367-8943-64c2836129c5	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
80	df9d80bc-f95b-430c-b3f7-0aec87e9314a	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b399b797-1153-4a4c-8968-9cda9f2c5d74	f	2025-11-13 21:56:43.507348+07
82	d014c4de-0211-48f5-89de-be4c9c36959e	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
83	6f4487dc-4660-4ebc-94e3-4b169b3a5686	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
84	f2404ee1-ba9e-453c-9f2d-83318b5e2106	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
85	8426b9e7-d550-4696-b5ce-e1e66f6a8585	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
86	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
87	4b04408d-6bd7-4436-91fd-b65716f2f563	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
88	80388e96-6204-41cf-b510-31e55b9df889	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
89	ce04e770-7d67-4082-a462-61d404c6a660	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
90	c7dc3940-a243-41af-9e8a-1fa454af1f87	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
91	323b184f-b460-48c2-bfda-5bca9943556d	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
93	f1484565-6580-4e47-83d5-564b464edcc8	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
94	8ac0483d-450e-4c3a-8083-3fb895f7935b	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
95	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
96	c339e72b-6acd-4367-8943-64c2836129c5	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
97	df9d80bc-f95b-430c-b3f7-0aec87e9314a	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/b49bd054-6bc5-4219-ab09-2763b8eafe03	f	2025-11-13 21:56:59.180511+07
99	d014c4de-0211-48f5-89de-be4c9c36959e	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
100	6f4487dc-4660-4ebc-94e3-4b169b3a5686	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
101	f2404ee1-ba9e-453c-9f2d-83318b5e2106	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
102	8426b9e7-d550-4696-b5ce-e1e66f6a8585	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
103	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
104	4b04408d-6bd7-4436-91fd-b65716f2f563	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
105	80388e96-6204-41cf-b510-31e55b9df889	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
106	ce04e770-7d67-4082-a462-61d404c6a660	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
107	c7dc3940-a243-41af-9e8a-1fa454af1f87	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
108	323b184f-b460-48c2-bfda-5bca9943556d	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
110	f1484565-6580-4e47-83d5-564b464edcc8	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
111	8ac0483d-450e-4c3a-8083-3fb895f7935b	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
112	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
113	c339e72b-6acd-4367-8943-64c2836129c5	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
114	df9d80bc-f95b-430c-b3f7-0aec87e9314a	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/4a895ad3-6e95-427b-b0cf-1a9d571a690a	f	2025-11-13 21:57:08.591862+07
116	d014c4de-0211-48f5-89de-be4c9c36959e	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
117	6f4487dc-4660-4ebc-94e3-4b169b3a5686	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
118	f2404ee1-ba9e-453c-9f2d-83318b5e2106	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
119	8426b9e7-d550-4696-b5ce-e1e66f6a8585	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
120	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
121	4b04408d-6bd7-4436-91fd-b65716f2f563	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
122	80388e96-6204-41cf-b510-31e55b9df889	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
123	ce04e770-7d67-4082-a462-61d404c6a660	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
124	c7dc3940-a243-41af-9e8a-1fa454af1f87	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
125	323b184f-b460-48c2-bfda-5bca9943556d	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
127	f1484565-6580-4e47-83d5-564b464edcc8	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
128	8ac0483d-450e-4c3a-8083-3fb895f7935b	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
129	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
130	c339e72b-6acd-4367-8943-64c2836129c5	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
131	df9d80bc-f95b-430c-b3f7-0aec87e9314a	Tin tß╗⌐c mß╗¢i: T╞░ vß║Ñn c─ân hß╗Ö dß╗▒ ├ín chung c╞░ PG Aura An ─Éß╗ông Hß║úi P...	/news/dfff637e-264a-4753-b7cd-71d670c33281	f	2025-11-13 21:57:19.43065+07
164	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	Welcome Home! You have been assigned to apartment B - 305.	/profile	f	2025-11-21 16:26:28.162025+07
134	f1484565-6580-4e47-83d5-564b464edcc8	Ch├áo mß╗½ng L├¬ Hß║úi Anh! Bß║ín ─æ├ú ch├¡nh thß╗⌐c trß╗ƒ th├ánh c╞░ d├ón cß╗ºa PTIT Apartment.	/profile	f	2025-11-18 16:21:11.942833+07
165	6f4487dc-4660-4ebc-94e3-4b169b3a5686	Welcome Home! You have been assigned to apartment B - 205.	/profile	f	2025-11-21 16:26:32.198355+07
142	323b184f-b460-48c2-bfda-5bca9943556d	Ch├áo mß╗½ng chß╗º ph├▓ng! Bß║ín ─æ├ú ─æ╞░ß╗úc g├ín v├áo c─ân hß╗Ö A - 606.	/profile	f	2025-11-19 16:33:24.758398+07
143	8ac0483d-450e-4c3a-8083-3fb895f7935b	Ch├áo mß╗½ng chß╗º ph├▓ng! Bß║ín ─æ├ú ─æ╞░ß╗úc g├ín v├áo c─ân hß╗Ö A - 404.	/profile	f	2025-11-19 21:11:28.773592+07
147	d014c4de-0211-48f5-89de-be4c9c36959e	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
148	6f4487dc-4660-4ebc-94e3-4b169b3a5686	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
149	f2404ee1-ba9e-453c-9f2d-83318b5e2106	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
150	8426b9e7-d550-4696-b5ce-e1e66f6a8585	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
151	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
152	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
153	4b04408d-6bd7-4436-91fd-b65716f2f563	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
154	80388e96-6204-41cf-b510-31e55b9df889	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
155	323b184f-b460-48c2-bfda-5bca9943556d	New Announcement: LEgo...	/news/86e9a6f3-b48f-4ec7-8232-e4fda7b1a3e4	f	2025-11-21 10:46:06.708136+07
166	f2404ee1-ba9e-453c-9f2d-83318b5e2106	Welcome Home! You have been assigned to apartment B - 204.	/profile	f	2025-11-21 16:26:37.127613+07
167	d014c4de-0211-48f5-89de-be4c9c36959e	Welcome Home! You have been assigned to apartment C - 204.	/profile	f	2025-11-21 16:26:40.821246+07
168	c7dc3940-a243-41af-9e8a-1fa454af1f87	Welcome Home! You have been assigned to apartment A - 605.	/profile	f	2025-11-21 16:26:44.962802+07
169	8ac0483d-450e-4c3a-8083-3fb895f7935b	Welcome Home! You have been assigned to apartment C - 305.	/profile	f	2025-11-21 16:26:50.968187+07
170	ce04e770-7d67-4082-a462-61d404c6a660	Welcome Home! You have been assigned to apartment C - 206.	/profile	f	2025-11-21 16:26:55.748502+07
171	c339e72b-6acd-4367-8943-64c2836129c5	Welcome Home! You have been assigned to apartment A - 504.	/profile	f	2025-11-21 16:27:01.774532+07
172	80388e96-6204-41cf-b510-31e55b9df889	Welcome Home! You have been assigned to apartment A - 705.	/profile	f	2025-11-21 16:27:10.039487+07
173	8426b9e7-d550-4696-b5ce-e1e66f6a8585	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
174	4b04408d-6bd7-4436-91fd-b65716f2f563	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
175	323b184f-b460-48c2-bfda-5bca9943556d	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
177	1fbe7162-51de-4ddb-b583-d806d9e2d40c	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
178	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
179	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
180	6f4487dc-4660-4ebc-94e3-4b169b3a5686	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
181	df9d80bc-f95b-430c-b3f7-0aec87e9314a	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
182	f2404ee1-ba9e-453c-9f2d-83318b5e2106	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
183	d014c4de-0211-48f5-89de-be4c9c36959e	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
184	f1484565-6580-4e47-83d5-564b464edcc8	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
185	c7dc3940-a243-41af-9e8a-1fa454af1f87	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
186	8ac0483d-450e-4c3a-8083-3fb895f7935b	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
187	ce04e770-7d67-4082-a462-61d404c6a660	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
188	c339e72b-6acd-4367-8943-64c2836129c5	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
189	80388e96-6204-41cf-b510-31e55b9df889	New Announcement: New Skyline...	/news/5a2fd606-ea9b-485e-a147-efe358c6f2e1	f	2025-11-23 21:14:47.171735+07
190	8426b9e7-d550-4696-b5ce-e1e66f6a8585	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
191	4b04408d-6bd7-4436-91fd-b65716f2f563	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
192	323b184f-b460-48c2-bfda-5bca9943556d	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
194	1fbe7162-51de-4ddb-b583-d806d9e2d40c	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
195	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
196	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
197	6f4487dc-4660-4ebc-94e3-4b169b3a5686	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
198	df9d80bc-f95b-430c-b3f7-0aec87e9314a	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
199	f2404ee1-ba9e-453c-9f2d-83318b5e2106	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
200	d014c4de-0211-48f5-89de-be4c9c36959e	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
201	f1484565-6580-4e47-83d5-564b464edcc8	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
202	c7dc3940-a243-41af-9e8a-1fa454af1f87	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
203	8ac0483d-450e-4c3a-8083-3fb895f7935b	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
204	ce04e770-7d67-4082-a462-61d404c6a660	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
205	c339e72b-6acd-4367-8943-64c2836129c5	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
206	80388e96-6204-41cf-b510-31e55b9df889	New Announcement: ─É├á Nß║╡ng: Chung c╞░ FPT Plaza 4 ─æ╞░ß╗úc ph├⌐p cung ß╗⌐ng r...	/news/21d08ceb-3e16-4c62-8672-52c17948ee16	f	2025-11-23 21:16:45.858498+07
210	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	Welcome Xuan Bach! You have officially become a resident of PTIT Apartment.	/profile	t	2025-11-25 15:10:26.851063+07
212	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	Welcome Home! You have been assigned to apartment B - 1804.	/profile	t	2025-11-25 16:09:07.728286+07
214	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	Welcome Home! You have been assigned to apartment A - 1404.	/profile	t	2025-11-25 16:30:45.623278+07
217	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	Welcome Home! You have been assigned to apartment B - 1804.	/profile	t	2025-11-25 16:35:16.42437+07
213	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	Welcome Xuan Bach! You have officially become a resident of PTIT Apartment.	/profile	t	2025-11-25 16:30:28.732634+07
215	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	Welcome Home! You have been assigned to apartment B - 1804.	/profile	t	2025-11-25 16:32:00.021012+07
216	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	Welcome Xuan Bach! You have officially become a resident of PTIT Apartment.	/profile	t	2025-11-25 16:34:54.037993+07
222	8426b9e7-d550-4696-b5ce-e1e66f6a8585	Your invoice #1 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
223	4b04408d-6bd7-4436-91fd-b65716f2f563	Your invoice #2 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
224	80388e96-6204-41cf-b510-31e55b9df889	Your invoice #3 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
225	323b184f-b460-48c2-bfda-5bca9943556d	Your invoice #4 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
226	c339e72b-6acd-4367-8943-64c2836129c5	Your invoice #7 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
227	df9d80bc-f95b-430c-b3f7-0aec87e9314a	Your invoice #8 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
228	f1484565-6580-4e47-83d5-564b464edcc8	Your invoice #9 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
229	8ac0483d-450e-4c3a-8083-3fb895f7935b	Your invoice #10 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
230	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	Your invoice #11 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
231	6f4487dc-4660-4ebc-94e3-4b169b3a5686	Your invoice #12 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
232	f2404ee1-ba9e-453c-9f2d-83318b5e2106	Your invoice #13 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
233	d014c4de-0211-48f5-89de-be4c9c36959e	Your invoice #14 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
234	c7dc3940-a243-41af-9e8a-1fa454af1f87	Your invoice #15 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
235	8ac0483d-450e-4c3a-8083-3fb895f7935b	Your invoice #16 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
236	ce04e770-7d67-4082-a462-61d404c6a660	Your invoice #17 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
237	c339e72b-6acd-4367-8943-64c2836129c5	Your invoice #18 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
238	80388e96-6204-41cf-b510-31e55b9df889	Your invoice #19 is overdue and a late fee of 100.000 VND has been applied.	/bill	f	2025-11-26 14:52:29.737756+07
239	1fbe7162-51de-4ddb-b583-d806d9e2d40c	Your invoice #6 is overdue and a late fee of 100.000 VND has been applied.	/bill	t	2025-11-26 14:52:29.737756+07
240	1fbe7162-51de-4ddb-b583-d806d9e2d40c	Payment Successful! Invoice #6 has been paid via PayPal.	/bill	t	2025-11-26 15:06:07.074747+07
244	f4f27bc2-3007-43c1-b9ac-239a12d4d949	Welcome Nguyß╗àn Anh V┼⌐! You have officially become a resident of PTIT Apartment.	/profile	f	2025-11-27 19:23:15.319379+07
246	80388e96-6204-41cf-b510-31e55b9df889	New Bill Alert: Your service bill for 12/2025 (Invoice #25) has been issued. Total: 465.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
247	c7dc3940-a243-41af-9e8a-1fa454af1f87	New Bill Alert: Your service bill for 12/2025 (Invoice #26) has been issued. Total: 465.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
248	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	New Bill Alert: Your service bill for 12/2025 (Invoice #27) has been issued. Total: 465.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
249	6f4487dc-4660-4ebc-94e3-4b169b3a5686	New Bill Alert: Your service bill for 12/2025 (Invoice #28) has been issued. Total: 465.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
250	8ac0483d-450e-4c3a-8083-3fb895f7935b	New Bill Alert: Your service bill for 12/2025 (Invoice #29) has been issued. Total: 465.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
251	323b184f-b460-48c2-bfda-5bca9943556d	New Bill Alert: Your service bill for 12/2025 (Invoice #30) has been issued. Total: 640.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
252	4b04408d-6bd7-4436-91fd-b65716f2f563	New Bill Alert: Your service bill for 12/2025 (Invoice #31) has been issued. Total: 640.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
253	d014c4de-0211-48f5-89de-be4c9c36959e	New Bill Alert: Your service bill for 12/2025 (Invoice #32) has been issued. Total: 640.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
254	ce04e770-7d67-4082-a462-61d404c6a660	New Bill Alert: Your service bill for 12/2025 (Invoice #33) has been issued. Total: 640.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
255	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	New Bill Alert: Your service bill for 12/2025 (Invoice #34) has been issued. Total: 640.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
256	8426b9e7-d550-4696-b5ce-e1e66f6a8585	New Bill Alert: Your service bill for 12/2025 (Invoice #35) has been issued. Total: 640.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
257	df9d80bc-f95b-430c-b3f7-0aec87e9314a	New Bill Alert: Your service bill for 12/2025 (Invoice #36) has been issued. Total: 640.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
258	1fbe7162-51de-4ddb-b583-d806d9e2d40c	New Bill Alert: Your service bill for 12/2025 (Invoice #37) has been issued. Total: 3.195.173 VND.	/bill	f	2025-12-03 10:20:43.999182+07
259	f1484565-6580-4e47-83d5-564b464edcc8	New Bill Alert: Your service bill for 12/2025 (Invoice #38) has been issued. Total: 640.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
260	f2404ee1-ba9e-453c-9f2d-83318b5e2106	New Bill Alert: Your service bill for 12/2025 (Invoice #39) has been issued. Total: 640.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
261	c339e72b-6acd-4367-8943-64c2836129c5	New Bill Alert: Your service bill for 12/2025 (Invoice #40) has been issued. Total: 640.000 VND.	/bill	f	2025-12-03 10:20:43.999182+07
279	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	Welcome Pham Quang Huy! You have officially become a resident of PTIT Apartment.	/profile	f	2025-12-04 15:14:19.334872+07
280	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	Welcome Home! You have been assigned to apartment B - 1805.	/profile	f	2025-12-04 15:14:28.95311+07
281	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	New Bill Alert: Move-in bill generated (Invoice #41). Total: 420.000 VND.	/bill	f	2025-12-04 15:14:28.95311+07
282	d5f9562e-b42c-4683-8519-5575613cbe9b	Welcome Nguyß╗àn ─É─âng Minh! You have officially become a resident of PTIT Apartment.	/profile	f	2025-12-04 15:25:47.023441+07
284	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	New user '─Éß║╖ng Huyß╗ün Trang' (email: trangdang1805@gmail.com) has verified their email.	/admin/user-management	t	2025-12-15 11:45:51.95973+07
285	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	New user '─Éß║╖ng Thuß╗│ Linh' (email: dangthuylinh@gmail.com) has verified their email.	/admin/user-management	t	2025-12-17 10:49:50.238993+07
289	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	Resident ─Éß║╖ng Thuß╗│ Linh has submitted a new vehicle card registration request.	/admin/vehicle-management	t	2025-12-17 13:32:21.535181+07
290	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	Resident ─Éß║╖ng Thuß╗│ Linh has submitted a new vehicle card registration request.	/admin/vehicle-management	t	2025-12-17 13:55:12.875066+07
291	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	Resident ─Éß║╖ng Thuß╗│ Linh has CANCELLED their registration request for car (Plate: 29C2-17521).	/admin/vehicle-management	t	2025-12-17 13:59:02.307305+07
287	33d3a768-1c01-4385-acc6-b3c2f505ec6d	Welcome Home! You have been assigned to apartment A - 1802.	/profile	t	2025-12-17 11:33:40.694848+07
288	33d3a768-1c01-4385-acc6-b3c2f505ec6d	New Bill Alert: Move-in bill generated (Invoice #42). Total: 309.678 VND.	/bill	t	2025-12-17 11:33:40.694848+07
286	33d3a768-1c01-4385-acc6-b3c2f505ec6d	Welcome ─Éß║╖ng Thuß╗│ Linh! You have officially become a resident of PTIT Apartment.	/profile	t	2025-12-17 11:33:33.838582+07
292	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	Resident Anh Hß║úi L├¬ has CANCELLED their booking for Community Room B on 19/12/2025.	/admin/amenity-management	t	2025-12-18 09:39:20.185901+07
295	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	Resident Anh Hß║úi L├¬ has requested to reissue vehicle card (Plate: 29C2-17521).	/admin/vehicle-management	t	2025-12-18 16:23:25.57848+07
296	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	Resident Anh Hß║úi L├¬ has requested to cancel vehicle card (Plate: 29C2-17521).	/admin/vehicle-management	t	2025-12-18 16:37:33.981708+07
294	33d3a768-1c01-4385-acc6-b3c2f505ec6d	Booking Confirmed: You have successfully booked Community Room B on 20/12/2025 (8:00: - 20:00).	/services/amenity	t	2025-12-18 10:10:16.772001+07
298	33d3a768-1c01-4385-acc6-b3c2f505ec6d	Payment Successful! Invoice #42 has been paid via PayPal.	/bill	f	2025-12-18 17:26:37.898436+07
299	eb57936e-043e-42e5-9737-e268658202a1	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
301	d014c4de-0211-48f5-89de-be4c9c36959e	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
302	f2404ee1-ba9e-453c-9f2d-83318b5e2106	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
303	80388e96-6204-41cf-b510-31e55b9df889	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
304	c339e72b-6acd-4367-8943-64c2836129c5	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
315	df9d80bc-f95b-430c-b3f7-0aec87e9314a	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
316	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
317	f4f27bc2-3007-43c1-b9ac-239a12d4d949	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
318	f1484565-6580-4e47-83d5-564b464edcc8	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
319	c7dc3940-a243-41af-9e8a-1fa454af1f87	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
320	8ac0483d-450e-4c3a-8083-3fb895f7935b	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
321	ce04e770-7d67-4082-a462-61d404c6a660	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
322	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	New Announcement: ssdad...	/news/62e5da79-2947-40b1-9711-f57d382ee945	f	2025-12-19 13:32:16.010079+07
\.


--
-- Data for Name: room_bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.room_bookings (id, resident_id, room_id, booking_date, start_time, end_time, total_price, status, created_at) FROM stdin;
1	c2f026a4-2766-4487-a5d4-f75c2306546a	1	2025-11-19	08:00:00	12:00:00	400000.00	cancelled	2025-11-18 15:46:08.843281
3	c2f026a4-2766-4487-a5d4-f75c2306546a	1	2025-12-02	16:00:00	19:00:00	300000.00	cancelled	2025-11-19 22:09:18.152854
2	1fbe7162-51de-4ddb-b583-d806d9e2d40c	1	2025-11-19	13:00:00	16:00:00	300000.00	cancelled	2025-11-18 15:48:35.186518
4	c2f026a4-2766-4487-a5d4-f75c2306546a	1	2025-11-27	11:00:00	14:00:00	300000.00	cancelled	2025-11-19 22:16:43.899505
5	c2f026a4-2766-4487-a5d4-f75c2306546a	2	2025-12-12	19:00:00	21:00:00	300000.00	cancelled	2025-11-19 22:18:09.100069
6	c2f026a4-2766-4487-a5d4-f75c2306546a	2	2025-11-27	09:00:00	15:00:00	900000.00	cancelled	2025-11-26 15:44:42.866763
7	c2f026a4-2766-4487-a5d4-f75c2306546a	2	2025-12-19	09:00:00	16:00:00	1050000.00	cancelled	2025-12-09 21:43:39.89691
8	c2f026a4-2766-4487-a5d4-f75c2306546a	2	2025-12-19	08:00:00	10:00:00	300000.00	confirmed	2025-12-18 09:39:33.050448
9	33d3a768-1c01-4385-acc6-b3c2f505ec6d	2	2025-12-20	08:00:00	20:00:00	1800000.00	confirmed	2025-12-18 10:10:16.751985
\.


--
-- Data for Name: room_type_policies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.room_type_policies (type_code, description, max_cars, max_motorbikes, created_at, updated_at, max_bicycles) FROM stdin;
A	Type A: 1 Bedroom (45m2)	1	2	2025-11-27 11:05:49.523615+07	2025-11-27 11:05:49.523615+07	2
B	Type B: 2 Bedrooms (70m2)	2	3	2025-11-27 11:05:49.523615+07	2025-11-27 11:05:49.523615+07	3
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rooms (id, room_number, floor, status, block_id, resident_id, area, bedrooms, room_type) FROM stdin;
2975b956-550e-44fb-8e23-da99b1fdcf13	501	5	occupied	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	c2f026a4-2766-4487-a5d4-f75c2306546a	45.00	1	A
4dd58648-cd86-499c-a22b-7f61a6dd9ffb	1805	18	occupied	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	45.00	1	A
02f2f3c4-180a-4595-8f3c-7032cd7be577	102	1	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
850dc47a-2ade-4fa7-b1b2-071186a1471e	104	1	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
5ef0724f-580b-46c8-a99e-659eb43e0e15	106	1	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
8c5649d7-c878-49e7-8d54-82f6cf2501fd	101	1	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
39f3be03-2a4b-4a54-adb0-87fcfefb93ee	202	2	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
ec3240c8-8426-4f4d-a23c-38fb1858bac9	204	2	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
932e956d-0512-457b-b8d1-13275fadaf01	206	2	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
a46a55a1-c80c-4b49-85a7-4f88835deca3	302	3	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
eea210aa-4e52-44e2-bfa9-078322241236	304	3	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
2ca4f03b-8d02-4c72-af46-ec4f518a6b80	402	4	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
903ba2e8-a0a4-4f57-bd17-9f7fe2ef8237	502	5	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
fa0591ef-4de5-4149-b66c-f94f3e6271c4	506	5	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
d21d4776-b0aa-4aea-9810-8bb296af1bb1	602	6	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
06b6eafc-1bbd-4ef9-830c-02040a1b7159	604	6	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
dcdd3754-f6d8-410a-a656-1338b1eb7af6	702	7	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
7538216e-9472-4b26-a708-91d2f70bb5f4	704	7	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
e84a8801-3708-460d-b3b2-5c5e97627cdd	706	7	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
4bdc8be6-921d-4e81-8bf3-f1e079214b91	802	8	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
bf30841f-05f3-42a5-a893-2ce79f5c785d	804	8	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
9859b950-b9b5-4070-ad19-18ada42d36b1	806	8	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
0e9453f4-ee43-40a2-8968-f0994701a63a	902	9	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
7ff1efb8-2ffe-4277-914b-1440c160ad04	904	9	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
3514bf6b-17aa-4544-8c56-df8c3e0f9d18	906	9	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
f3aaa1bc-1684-4089-8eb8-cafd09d10bb2	1002	10	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
aa82b2bf-1fa4-4177-a00a-b0e1f0edbac6	1004	10	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
3c9f635e-db87-4170-9947-81d65f373e7e	1006	10	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
96faa82e-8757-42c6-b423-7acf01d68476	1102	11	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
763ff3a7-3c3b-4a28-84cf-98b45302edd3	1104	11	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
59e8bd9c-89d2-4d90-98b1-a5ef2e4c422c	1106	11	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
626323ab-cc03-47a1-92b6-6ce741dde538	1202	12	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
73a5d8bd-43a3-4e3e-80dd-24a02860a0a1	1204	12	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
ba3aba22-207f-4cf6-876e-925f8c9eae68	1206	12	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
4a4734df-47b9-4fca-8ad6-1418539fa261	1302	13	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
664ab73e-fdef-4592-86b0-500102d1e299	1304	13	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
897b1c78-197c-4978-b357-433c81331507	1306	13	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
bfff64e1-de66-43d8-9814-bf886baa2f62	1402	14	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
cd370725-e19d-4e46-b35f-0bd7ab877f77	1406	14	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
47c819c6-1cda-4666-901e-a1b79c057653	1502	15	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
9086823d-3d26-40c6-a4d6-37516a4dbe3b	1504	15	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
f8940c6e-2e0b-44e9-b70c-30a6ab9638e9	1506	15	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
990ce75d-9d0c-4166-acc9-e5feec4bbf7c	502	5	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
c09a62aa-4154-4c9a-8f8c-b8c914be091d	1802	18	occupied	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	33d3a768-1c01-4385-acc6-b3c2f505ec6d	70.00	2	B
94a2c1d9-d1cf-4415-aa51-e443442635f5	1702	17	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
43d115bf-4823-4849-b956-4f26a6cd49f3	1704	17	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
3007c138-3c7b-444d-af41-cbb9369818e6	101	1	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
80afdbd9-2c77-48d4-88a0-a2bd5772d09e	1706	17	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
c4f8df72-150d-400e-8ec2-98ec6debdea7	1804	18	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
ece5053c-d9b5-42b1-8b40-0ca3c9a14855	1806	18	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
eab5eab0-bd7e-4607-a3b6-81a1d32de13b	1902	19	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
2976c4be-b4e8-4879-801b-9f3e60a35ccc	1904	19	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
841f1610-f304-411d-a61a-cc3bf8944a00	1906	19	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
c6f431c2-f364-4e8e-867b-67a4cc9f3efe	2002	20	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
2684edc0-b06c-4cd6-8263-62fcc1aeff67	2004	20	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
9bc258c2-4ef4-4673-aed4-18802f17ecfe	2006	20	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
46e25115-204b-4c96-a1c8-0262ab413ddd	104	1	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
6925fb8f-4f9f-4bca-83ee-d776322977e8	106	1	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
00a98751-9d20-4f33-83c7-1901c6631833	202	2	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
618b9336-c0fd-41a4-a1f5-524a22cca5af	302	3	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
da257513-9c41-471e-a4a2-3b18b38a8210	304	3	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
dcd67aa5-328b-4daa-97c2-60db46b3869d	306	3	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
0c9a0d47-c6ec-417b-b2fa-3d43bef45708	402	4	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
dfaf97a5-50bc-4389-a634-37d4ec3dce74	404	4	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
82db06cf-05e4-434b-8197-3db548d47cf4	406	4	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
67e44405-2ac3-45f3-b833-e33f23166552	506	5	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
3c7185dc-a54b-4c71-9313-736f007a137c	602	6	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
9c08ee68-c0b2-4872-9400-14e98b031fe4	604	6	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
573d9b8c-84bb-460b-8e2b-fa18bc2cfee5	606	6	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
ad3c3952-573e-4bab-8fd3-827f3e7564cb	702	7	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
e0f9c498-36f9-43e3-8830-45e844844bd7	704	7	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
0006c0ec-5056-467b-8c94-3fa0c28741eb	706	7	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
0f24708f-7db1-48ad-8410-b07bd5bf866b	802	8	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
2d25ccb7-cf30-4c1b-ba97-19e3d938aac4	804	8	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
cf9e815b-01ac-4f06-96d0-eee92da6b815	806	8	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
a4f39d2a-ec8d-4bb0-aa90-958ffa2e2f67	902	9	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
97095a23-362c-4169-a007-2aee78f5f3b8	904	9	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
b44f0ddf-8668-45bd-bae7-08723dcbbf60	906	9	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
05b0fcd6-330d-4a65-9535-3d507584ae05	1002	10	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
d364856d-d7bd-4156-9d13-65b8a8a23dc5	1004	10	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
4a9427f1-a2cd-40ea-9190-3fe6313f818f	1306	13	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
39a4a3b0-3c25-4a56-bbdd-d30ad64b2a52	1303	13	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
1ee373f0-87ca-4921-9d45-af9a0c02bcd6	1402	14	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
d84ba690-e077-4e41-b8fb-4aadbe48fa14	1404	14	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
a4317382-32f0-4bb2-b8d8-8420bee57689	1406	14	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
6ec8a32a-c107-48f2-b83a-5968a1ea41be	1502	15	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
1b40f936-c42a-4d05-a3b7-e2ce046a57da	1504	15	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
baba806d-27cd-4b44-a7f7-85b0a2a0321a	1506	15	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
8e50d424-943a-447e-87b2-808401a9f6a4	1602	16	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
0253e09c-cb87-4c92-95ca-e26d665a5f15	1604	16	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
8d8b7072-edaf-4f3e-8933-54827d4c9237	1606	16	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
7361719b-e282-4966-a8bc-0060ce0d7331	1702	17	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
e6dc1997-c24b-4ace-a29b-3c488bb308bd	1704	17	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
8e840ab9-7ddd-45fb-a1b8-0a264a0cc6e9	1706	17	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
9e41e6b1-7bff-4c92-b6f4-0fcb45047e28	1802	18	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
31490e2b-eee5-4693-ad9e-0d4b653915d5	1806	18	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
0e0c1727-bd65-4be3-b945-50dd93a017b3	1902	19	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
8831ee27-19c5-4f32-ae0f-37834abee3c0	1904	19	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
a224d8d0-8007-4dc6-9025-e98db52629c0	1906	19	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
c207398e-6bd5-418a-b29e-c285c083a126	2002	20	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
d65e23e4-c2ee-4cb1-bf8c-10143b3e93fd	2004	20	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
e4a6bcf8-729d-41b2-8f0c-11f2eaf8a857	2006	20	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
bebcd4dd-0a02-4a86-9869-c62130f1a2ef	102	1	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
ace79b79-ab32-4bca-9821-b61690d4fcc8	104	1	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
41287a7f-b82a-4420-9b03-30bfe560aedf	106	1	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
e9fd5851-3853-4abd-a6f6-4aba560e85fb	202	2	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
9d5a77bc-4fb6-47be-80be-48bb9486e8ea	302	3	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
3a96f631-fcc1-448d-b12d-70772c4fc79b	304	3	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
6ea12ad2-6fbc-451c-9740-d3ebb256a872	306	3	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
4e143732-970d-4d5f-ab50-5baaa28a6085	402	4	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
b50027fb-9bfd-4306-bc44-3df93c101d80	406	4	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
eb8f30d7-0156-4f47-b98e-ae2032546d4f	502	5	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
8f65a6c8-3e41-4764-973f-3cedd831fca7	504	5	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
18da9c0d-5d52-4ce3-9e83-9a3bfa775021	506	5	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
5e134fb0-dc42-4a67-8f63-4576cd191759	602	6	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
0c1c11d3-3c74-49a0-9ed5-6e42aa3bccfd	604	6	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
03cf6a6a-5048-4e34-801a-db0f489f10f1	606	6	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
47c7fffd-1008-4e08-b204-33c7f9b92655	702	7	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
9addd27c-779c-499e-afd9-aec70d8bd7d0	905	9	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
678859ce-8232-4bcd-9ffb-6ccacf948a2d	103	1	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
72074813-2d85-428f-ad25-d8744241b170	105	1	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
1130cef0-cc2d-4a61-9898-598449c3ce09	201	2	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
0e7e96d3-5089-4e32-8cdc-d9b96371f9bc	203	2	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
169fc4de-40f6-4d23-9898-830dc4b33b86	205	2	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
b1f7ce5a-a3ec-4320-bfa1-190d13c87e92	301	3	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
9fe1ae6d-1414-4792-82da-a355d1827f5c	303	3	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
17402114-75ac-448a-8987-59db76217c4c	401	4	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
a6b6f287-9a17-4d13-91c3-b8e5ab8152ba	403	4	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
f86b65fb-b766-4579-821d-a72235c8d074	1001	10	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
5fab1f1b-96c9-49cf-831c-6480a7f477ae	1003	10	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
0040dca3-872e-4b10-9076-a6750c433b1e	1005	10	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
e3183728-8b8d-4e1b-a1fe-3f65722510d7	1101	11	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
1e35b148-8b93-4d10-af14-b0aed85f06c0	1103	11	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
01d2219e-ad01-449f-ab51-f73be78b9601	904	9	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
b9e50627-fbb5-4180-9e68-8396a57c65fb	906	9	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
ad285e9f-9132-4066-bbfe-b59cf27ce000	1002	10	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
94039e9a-7a64-4a0b-8fc0-d962cda2f85f	1004	10	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
73989f7c-93f3-4285-b50a-c0c5fa92fd4a	1006	10	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
104f73c5-e7f0-4f19-bafb-d4ed7735dc7a	1102	11	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
7d8670c3-c45e-49fb-a140-017afda58cab	1104	11	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
61c59bdc-fc44-4229-9ce3-84ec3ec9288a	1106	11	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
f968625e-b21f-4423-8624-1d3ed11f7400	1202	12	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
2c219310-eb3b-4374-a1f3-14c4faaf76d2	1204	12	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
89f2e6bb-9a60-4b2d-bca8-d920799dd5d5	1206	12	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
f0ad97d7-eab7-4c5f-9f13-909c769291c3	1302	13	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
537e1f7e-b1f1-4f46-a752-7d89c5b25c0a	1304	13	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
6314ee9a-2ea7-4864-a86e-dd5932a20646	1306	13	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
7290fee6-c0df-4cf9-a05b-52d156905898	1402	14	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
a3637901-a222-400c-9d97-d88a50cdb9db	1404	14	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
88a97014-cb56-4cdd-9830-03d442426c0b	1406	14	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
16ac65df-f821-4e52-9358-3044254a8217	1502	15	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
bb7eef34-c755-42b5-bc14-e282762acedb	1504	15	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
92d50d15-9dc3-48bb-8d68-4176f1dcddd6	1506	15	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
bdd9c5fa-f6a7-4e24-82b2-a93692309c43	1602	16	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
98b880f0-da5f-47b9-afc8-a9cd4a95ecba	1604	16	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
b5a9d93c-1013-4dd7-8dbb-806629afeae5	1606	16	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
111884b0-bbbc-449a-9180-5f70aadd01bb	1702	17	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
876db906-f0d6-4772-b4ec-ba2c4c2062c5	1704	17	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
1d351a1e-7e27-44a8-84bb-378c7c7bda2a	1706	17	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
4407a481-da07-498c-b423-3044e1e10982	405	4	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
625d5f8a-0672-46a5-b3c9-114b7640cc0b	501	5	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
cff16816-de2f-4118-b1f4-88c2a473f9c7	503	5	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
48af970a-a551-4155-9f64-354bdd7edb57	505	5	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
9957dc9c-c6d0-481d-9caf-396662e571c4	601	6	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
44aeb49f-52ee-4d4b-9372-80fd57ae2ed0	603	6	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
f9eb8d6d-9cca-4549-913f-f6d04482c8ab	701	7	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
4a75187a-cad2-4945-9cf5-b0b77ffd6049	703	7	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
9a913d68-ee8c-463e-9860-9fb645e51a3b	801	8	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
4b9b3da8-e7f4-446a-b33f-7090166449a2	803	8	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
72df1c2e-9e8d-42a9-b27c-d190bdc8a8ed	805	8	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
25f35f3d-b933-42f2-9047-d7bc9ee5f68f	901	9	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
9f370534-3e2c-444b-ac70-85864e6e41cb	903	9	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
3f2d7b2d-6480-4f1e-a853-568240dbd278	905	9	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
f9d3357f-15b3-42ec-9b8c-d9fee79d08f0	1001	10	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
b1fe288f-2533-4906-9c58-781246bedea4	1003	10	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
b869e28c-24b2-478a-a9e1-4b67c8cd8bfe	1005	10	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
be00b619-31b8-4b69-b5b1-55e7d5e88388	1101	11	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
7281184b-c15a-430f-8650-fc57a3ca7bdd	1103	11	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
d1b47442-ac96-4986-97f8-91572cbd43f6	1105	11	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
e2575c3b-f5e7-4e5a-abeb-d266227b07a4	1201	12	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
5d56d993-741b-4992-ab56-34745501cf7a	1203	12	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
68ecbe1f-e562-45a3-9038-0fcd8631bd61	1205	12	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
22735bc3-51c9-4f7b-a27a-6b5cca12e268	1301	13	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
0be4adbd-b61b-425a-9506-bea995b4311d	1303	13	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
c66be2c7-efa8-4a69-b3d1-d5a759210d20	1305	13	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
2f83ef6b-fccf-4cbc-bd48-1392e661c584	1401	14	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
fca6d906-b071-483e-906f-b468c6e4ec63	1403	14	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
a47975c3-a1c5-424a-b076-5617240ff326	1405	14	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
bf73f68b-3138-4bea-b834-74742455883d	1501	15	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
bf4af715-c96d-4adb-87f0-e244bd03f3cc	1503	15	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
14497df5-2f27-4790-90a7-eec8f5dfbfd7	1505	15	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
14a086f6-b7e1-48ac-aeb5-926ac3f502ea	1601	16	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
66f762de-4ad0-488b-94e9-e2907aa8b030	1603	16	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
681f5e37-39b9-49fd-a3b0-920f24d3e55f	1605	16	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
5eb2b912-fa73-4353-b746-e9783537c62e	1701	17	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
ace4d375-5dcd-477d-8db7-d36b7604834e	705	7	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	80388e96-6204-41cf-b510-31e55b9df889	45.00	1	A
52225ab3-be6a-4a65-9f45-7efd0028a8a6	305	3	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
fe92608c-9284-428e-9af2-e470cd5d63f3	605	6	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	c7dc3940-a243-41af-9e8a-1fa454af1f87	45.00	1	A
d48821c8-fdf0-4005-846f-f21b509151a2	1703	17	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
6a9a394f-3626-4b10-8073-e12b04515db4	1705	17	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
99e39e82-e579-4da3-877d-dd704b2bce1a	1801	18	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
5389ad1f-f0a1-4e5c-94f1-ae04f5c2fb37	1803	18	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
6a750d0e-5f6b-4bb2-bac9-ffe256a031bc	1805	18	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
2edf2a22-ee32-4c69-bc2b-db73f516da73	1901	19	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
1eaa4f05-2fa6-45c2-b24d-6e0661c1c8f6	1903	19	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
8fd84d19-5723-4392-a143-9d739d1ae3fb	1905	19	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
04e32cee-70b8-4a7e-8b79-14f60607f3f5	2001	20	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
0a2a6ab7-c6cb-41e0-a4f1-0d17fa2d82e7	2003	20	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
137f6f27-2062-414d-b407-35de1b8c001b	2005	20	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	45.00	1	A
d72c764e-7f7a-49b5-81c7-869961a6c34d	103	1	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
6b2f958e-93c7-40f5-8932-9559e478e932	105	1	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
0b49e30f-957f-423d-bb53-c95f3a6fe1e7	201	2	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
30b378ec-8d6e-464d-a395-01e4d6ea1454	203	2	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
44491ff6-e82c-47e3-9288-a945e25f2815	301	3	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
bf8708a0-d57c-4a6f-af7d-14a44cf76232	303	3	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
9d93610a-e0c0-4aa6-baba-deedf1229071	401	4	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
1b511af3-1df3-4343-b8d3-4c565021acdd	403	4	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
2f574762-f4e6-4149-a058-4071406a2d8b	405	4	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
8d4cdbe4-5aff-4a63-894d-487c84f0e3be	503	5	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
8bcc6ec4-d3f7-4549-9ef5-f554e8d275a8	505	5	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
db28ae13-64cd-436c-9145-e53afa35b06b	601	6	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
d906bafa-852c-41aa-bbe5-d741bd35b530	603	6	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
5b048ab0-f733-43ac-b5c4-4ceefd34eadf	605	6	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
6c7fcc1b-22e7-4fe9-951e-6b50136720f6	701	7	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
715105f8-7f1e-4f9d-89ba-c33059975f7c	703	7	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
54f45ef8-3cee-4041-b00c-2e2275de3350	705	7	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
ea1cd9ca-5436-4036-a611-97346519d14b	801	8	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
508d8014-5c57-4c3b-a8cf-bcd2d5811af7	803	8	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
0874d080-9025-4b91-b722-70767e4271ed	805	8	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
2e894966-22d0-4fa1-bd31-803385c2f1f8	901	9	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
7f50d20c-f516-4d90-99ab-2582f5dc8fc4	903	9	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
2dde456f-5af7-4123-838d-9ca0de5c40d4	905	9	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
27ae7c85-3517-4505-aa60-be6ab3919347	1001	10	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
97ec624e-e1f5-43cd-8f18-6f1a7ecc1a53	1003	10	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
55d3cd69-15ed-44c4-9308-c641efc23647	1005	10	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
9129838a-7345-4fab-8120-4b59f6143659	1101	11	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
c29ecb67-83f1-4371-b78e-10733128bad4	1103	11	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
c9628611-75f7-4339-971b-4c4c03343c12	1105	11	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
a6eca170-449a-4703-964c-7911ab86ecca	1201	12	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
6552d368-33b4-4e25-861a-7336e266a07b	1203	12	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
4c4311b5-14a7-4041-bcc4-ed1dbbc981a8	1205	12	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
b87e29cc-d3fc-4448-a9f2-7ffd0e7fee84	1301	13	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
fb5d85c7-99ed-4aec-a4a7-d156dd0e6ecd	305	3	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	825a94f6-3b05-4d9d-806d-9abefdb6aa9b	45.00	1	A
b399fcc5-58b4-41fb-955a-d700d47b5151	205	2	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	6f4487dc-4660-4ebc-94e3-4b169b3a5686	45.00	1	A
4a64007a-7ca6-4faa-b3ff-03a7b7a30099	1305	13	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
a1f91168-835c-495d-89d5-1ac20519d28b	1401	14	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
cd48a212-c551-416e-aab4-eac2ab3958c0	1403	14	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
37e73814-b5f4-4ef2-b92f-a155c4d8ee9e	1405	14	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
27777586-7134-42dc-900c-04b5d71366b7	1501	15	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
d12db103-7471-48dd-99e5-923d706ef758	1503	15	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
a7e70dc6-9087-4cbc-8726-a36fd1422ca0	1505	15	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
5e6c9bf6-5729-4efb-acf5-7e0d816c9026	1601	16	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
a9e2d118-287a-421d-a6a3-bf3c159bc12f	1603	16	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
93563b97-dc6a-44a0-9fa8-e17662090f07	1605	16	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
b07bcfdb-a9b9-4913-97dc-cb71395c2b95	1701	17	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
f8993287-4c5e-4934-859c-e99d69b86d22	1703	17	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
7ecf8498-810b-494e-a204-41a02770d2ad	1705	17	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
c0d31504-84c4-40fa-9d31-8cd207a869f4	1801	18	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
45bddfc0-f608-4b3a-b8db-906ed14d5d47	1803	18	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
52dcd266-9064-45a8-bc1f-b72cd7631c59	1901	19	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
2b43af87-24c0-4bc4-aae8-b0545af21e90	1903	19	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
57e58a8a-8ecd-468f-baf6-66acba1a1cf0	1905	19	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
159d6686-7160-4b81-bf28-59eb582a9904	2001	20	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
17fa00a6-75a4-4fff-a8de-05fad4f22090	2003	20	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
e575c3a6-0202-41b8-8662-8e0c79e394b6	2005	20	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	45.00	1	A
e7e30aac-a76b-496b-b09d-67beac8652ed	101	1	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
ae94c422-ed07-4b63-a7c2-b84c65dae49f	103	1	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
a17c86fb-6ea3-45dd-a908-48e334f64464	105	1	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
50fd0e0d-6e9b-4f59-86e6-a4faa4be6758	201	2	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
55ed3457-215f-455f-a318-3a70ff626a26	203	2	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
b969def9-6e17-4027-b379-e5f3ab889e9a	205	2	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
e06bd0de-cd8e-4809-bd21-3802e3db0693	301	3	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
88702a3f-8c5a-43ad-9304-4dfdfd7fd997	303	3	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
d8b7e5b9-b307-461c-a214-c21daa36d0c1	401	4	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
486511c7-c240-447f-ae30-9cc2a01156fa	403	4	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
cb7574a7-c184-4d72-b009-a1eeecc60980	501	5	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
56dca172-bbfb-488f-8499-a7102c096db0	503	5	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
84ae89ce-47b2-4480-b92b-b06f56faf3d5	505	5	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
b540e0b7-e5c0-41eb-904d-77fb4e8e4120	601	6	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
8d576aa2-640d-468c-9755-693f91329a5a	603	6	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
40e0ceb7-af51-4f00-b6ba-042772cfd58d	605	6	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
3b817d96-e797-4f37-a76a-4b5629b08e4a	701	7	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
62016653-5382-4e8f-8919-8bc2bab65eb6	703	7	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
6b01156f-5b3c-4987-bcfa-e2660f10608c	705	7	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
dc475db4-5cfb-4011-bc4b-89a7aef7425c	801	8	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
f54360b9-6c07-42d8-b75e-5eefe58a8399	803	8	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
81361ebd-befc-443e-b26c-02e6dd3003f4	805	8	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
22cece30-2c25-4a68-bad1-e293528a84f1	901	9	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
ecff4cb4-b8f4-47e1-a42c-6ae6aaa93791	903	9	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
5930bbd5-d3e1-403d-be17-a0d7796a4828	305	3	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	8ac0483d-450e-4c3a-8083-3fb895f7935b	45.00	1	A
4cb18d00-0243-4973-9bf5-2625feb73821	1105	11	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
58e85a8b-07aa-4077-91a8-e488d6a14f8f	1201	12	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
2887e337-06a1-42cd-9b56-b54c58959ec3	1203	12	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
ba6a5b5c-0a3a-4dff-93ee-83f4e69c7709	1205	12	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
01d47d48-6cc1-43b5-b38d-3299a205a1f0	1301	13	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
5a0d51e2-12f2-4a52-9f6a-5c80647dd57f	1303	13	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
23180db3-634c-4f36-95d4-4014610d14e9	1305	13	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
66641dbd-b235-4076-a79d-e61ff648ea0f	1401	14	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
30768287-fea7-4fd6-841a-2e0c848830d3	1403	14	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
34d8203a-7efb-4314-828b-fd04ca630ffc	1405	14	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
b3234da5-3ea5-4da8-9fcc-e94f860c8215	1501	15	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
42933c33-53ec-4aa5-81be-61b47b513004	1503	15	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
cdaeefb3-5584-45c4-8b37-ec31d79d9d98	1505	15	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
56055a3b-1cf0-41fb-a3e4-bc8bbd7c5912	1601	16	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
b99473bf-f864-4ffd-97b8-6e05b1ca13f4	1603	16	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
8ad21b3a-f8bb-4879-87b3-ad16183d6116	1605	16	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
39049499-8758-47f8-8f6d-dc39f581c2a2	1701	17	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
ac5b4da7-63ee-4649-bda1-44d4734ac7fc	1703	17	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
7d608007-bf50-4b6f-a96d-db6603c03734	1705	17	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
3b44b23f-a8fa-4e8d-ad3a-639084c84147	1801	18	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
eb0ccedd-02a1-4e0d-9f58-c5fdcbad48cd	1803	18	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
e284a025-d70a-4fe4-9762-da39a3771369	1805	18	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
6d16d1e0-fc9c-45d2-9eeb-bc87d85ee0d6	1901	19	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
f23d9ffe-4094-48fa-be44-ae28ebab5202	1903	19	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
e6726209-13aa-4d57-bc0a-de160cc23f9d	1905	19	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
6b07cf72-89f1-4f76-a920-3009601f1893	2001	20	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
58886462-7d56-4f21-9b3e-0b9454ac0fcb	2003	20	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
b89dec48-d80a-453d-b54d-3a2c719f1ff8	2005	20	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
9e046c96-f542-4412-8eb8-ee0051361642	405	4	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	45.00	1	A
bba61666-f49a-47ff-810c-4fb4e2eb0bb2	1602	16	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
6838ab85-15f4-4d74-9ad0-08f375890e3f	1604	16	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
e745cfca-6a8a-418c-8306-b27e399d8b06	1606	16	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
6f4f905a-230f-4caf-83ee-6fbc13d0de9f	606	6	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	323b184f-b460-48c2-bfda-5bca9943556d	70.00	2	B
d433b93c-abf9-4fcd-8c19-cbed525c3bdb	404	4	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
534917e2-2c5c-4fcc-b13c-23f652f104b5	1404	14	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
13b268f3-5dfd-4ff4-92c8-601d18c3cf6f	1006	10	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
6d353041-1fa2-491e-b21f-bad176c3e74c	1102	11	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
77115d5f-5eb5-4a4c-b600-da0f0eb2973d	1104	11	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
9bab9c67-0cf3-4719-8eac-257b432fa6ed	1106	11	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
f603cd63-1f46-4369-ad9c-dbd042dc9388	1202	12	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
0f4dd058-4635-498b-853e-a1f9c9007f86	1204	12	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
ffea04ac-e09f-43b4-be69-8af2782fbc21	1206	12	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
666ff12c-5d2b-4c33-8cbc-ef08fcf4e9f8	1302	13	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
4869c80e-f2d0-4797-a6de-e002faa6b823	206	2	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	4b04408d-6bd7-4436-91fd-b65716f2f563	70.00	2	B
c7c5bf23-b6b9-46ec-b6c5-2653d4790871	704	7	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
b977436e-96af-46e4-a81f-81f9109e8bfd	706	7	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
2f6d4621-0a18-4206-9564-21612037e6c9	802	8	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
e30c3331-46b5-40a5-9d95-78064df7864e	804	8	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
8c3e60cb-7bd9-4183-a503-49c5e9e56472	806	8	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
d76441be-11aa-45fa-8464-2b5c4cfaf6ed	902	9	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
b6424d83-375d-44ff-ad36-5ffa17791511	204	2	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	d014c4de-0211-48f5-89de-be4c9c36959e	70.00	2	B
bdee13ee-5962-48b0-b276-f4f0a0fb735d	206	2	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	ce04e770-7d67-4082-a462-61d404c6a660	70.00	2	B
7ff3f4aa-0c07-4721-b9c7-7dc863873b10	1804	18	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	70.00	2	B
56f285e5-b8a0-4702-bfe2-e3d3253b2328	1802	18	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
a95cb0f9-4c0e-4cf5-bcb4-148ec17d4057	1804	18	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
8a14dd42-e8b0-4372-adec-cc1f233235d4	1806	18	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
0929be84-cf13-420a-87c6-d2e7e25b3498	1904	19	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
110b1e12-9384-4935-9bfe-37bec321c447	1906	19	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
c19fea56-0045-4b48-bed1-5398111e77c2	2002	20	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
ac891583-0777-460c-88fe-7a1edf83124f	2004	20	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	\N	70.00	2	B
a57c5eab-6641-4aed-82d0-caf3bedb121d	404	4	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	8426b9e7-d550-4696-b5ce-e1e66f6a8585	70.00	2	B
e626c1d4-6077-442a-8036-505c9d688722	1304	13	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
9f29bc87-ca7a-4291-8f14-f97791a5765d	2006	20	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	df9d80bc-f95b-430c-b3f7-0aec87e9314a	70.00	2	B
d5da0afd-a8dd-4e88-b4b5-894121cd0e79	306	3	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	1fbe7162-51de-4ddb-b583-d806d9e2d40c	70.00	2	B
90a18a05-e954-4b37-8559-de7e7a3c237d	1902	19	available	45d7b9f6-4402-4df8-b6c7-fb3cbc758391	f1484565-6580-4e47-83d5-564b464edcc8	70.00	2	B
5cc8ae46-33d9-4566-964d-a870a21c0dc2	406	4	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	\N	70.00	2	B
8361ec3f-2be4-4194-8318-c25c8bc1a611	204	2	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	f2404ee1-ba9e-453c-9f2d-83318b5e2106	70.00	2	B
ac713861-8388-49bc-97a6-54b5ef858fd5	504	5	available	83d53bc8-664d-4f7c-8e65-0b8a232bb7ba	c339e72b-6acd-4367-8943-64c2836129c5	70.00	2	B
37533a34-f0d6-47dc-ab7e-fb9a686efa6c	102	1	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
1997f1f7-47f9-49c3-bcdf-7a053f67c856	504	5	available	01c61932-b7c2-4af8-ab2c-c4e291d35c6b	\N	70.00	2	B
\.


--
-- Data for Name: service_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_rates (id, service_name, rate, unit) FROM stdin;
1	management_fee	500000.00	VND/th┬áng
2	bqt_fee	5000.00	VND/th┬áng
3	car_fee_monthly	500000.00	VND/xe/th┬áng
4	motorbike_fee_monthly	100000.00	VND/xe/th┬áng
5	bicycle_fee_monthly	50000.00	VND/xe/th┬áng
6	car_card_onetime	200000.00	VND/th?
7	motorbike_card_onetime	100000.00	VND/th?
8	bicycle_card_onetime	20000.00	VND/th?
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (transaction_id, bill_id, user_id, payment_method, paypal_transaction_id, amount, status, message, created_at) FROM stdin;
1	5	c2f026a4-2766-4487-a5d4-f75c2306546a	paypal	29C48411NL098700Y	2650000.00	pending	\N	2025-11-21 13:45:55.748399+07
2	5	c2f026a4-2766-4487-a5d4-f75c2306546a	paypal	7UR89714XR5630931	2650000.00	pending	\N	2025-11-21 13:47:51.757411+07
3	5	c2f026a4-2766-4487-a5d4-f75c2306546a	paypal	9MB59610N9453934F	2650000.00	success	PayPal payment successful	2025-11-21 13:48:55.766075+07
4	20	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	paypal	5C83295483547434P	130000.00	success	PayPal payment successful	2025-11-25 16:43:59.46731+07
5	6	1fbe7162-51de-4ddb-b583-d806d9e2d40c	paypal	4NF24227N96925932	600000.00	success	PayPal payment successful	2025-11-26 15:05:50.541614+07
6	24	c2f026a4-2766-4487-a5d4-f75c2306546a	paypal	4R706092KB430301R	2692586.00	success	PayPal payment successful	2025-12-03 22:19:22.56377+07
7	42	33d3a768-1c01-4385-acc6-b3c2f505ec6d	paypal	6HT8814423715272L	309678.00	success	PayPal payment successful	2025-12-18 17:26:13.991237+07
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, full_name, email, password_hash, apartment_number, is_verified, verification_token, created_at, password_reset_token, password_reset_expires, role, phone_number, phone, is_active, last_room_id) FROM stdin;
eb57936e-043e-42e5-9737-e268658202a1	Nguyß╗àn Anh ─Éß╗⌐c	thedevilplayz1@gmail.com	$2b$10$L9IJ/XR1qINGlIwk5WBaee23IQ19GgRur3FKPk11UecVCuCkzHCqi	\N	t	\N	2025-11-24 11:30:49.482169+07	\N	\N	user	\N	0862748221	t	\N
c2f026a4-2766-4487-a5d4-f75c2306546a	Anh Hß║úi L├¬	thedevilplayz@gmail.com	$2b$10$2ZkiBMdnxd5OQkec32TQveVWm0Jrs29uRdlQHpMSkOUHpHdEPjHXW	B - 501	t	\N	2025-11-12 15:48:17.837+07	\N	\N	resident	\N	0862748220	t	\N
d014c4de-0211-48f5-89de-be4c9c36959e	Ph├╣ng Thanh T├╣ng	kocomailmahoi8@gmail.com	$2b$10$P1iQu/q2THkJ7VKZWUNnGOaBxgrTQjaGSLokx71oQZslql99ussnO	C - 204	t	\N	2025-10-17 11:28:12.342393+07	\N	\N	resident	\N	\N	t	\N
f2404ee1-ba9e-453c-9f2d-83318b5e2106	Nguyß╗àn Viß╗çt Anh	kocomailmahoi7@gmail.com	$2b$10$uynHp82ajyGPdp8cF8G96evLrowUrAKfXsjndMZUL35/tszTkao06	B - 204	t	\N	2025-10-17 11:21:18.663815+07	\N	\N	resident	\N	\N	t	\N
80388e96-6204-41cf-b510-31e55b9df889	Nguyß╗àn Hß╗»u Ho├áng L├óm	kocomailmahoi6@gmail.com	$2b$10$YRWs0er7tcL9b6D69w9zkuubgZG2mhWvw/QHoTE9qKxVXPM3bI.CS	A - 705	t	\N	2025-10-17 11:03:41.954393+07	\N	\N	resident	\N	\N	t	\N
c339e72b-6acd-4367-8943-64c2836129c5	─Éß║¡u Vinh Hiß║┐u	kocomailmahoi10@gmail.com	$2b$10$Gs98I/qegLf2BxfZ2LdwYuM39gY1GMmByGf.141zPIw74a5WDbUC2	A - 504	t	\N	2025-10-17 11:30:52.071616+07	\N	\N	resident	\N	\N	t	\N
8426b9e7-d550-4696-b5ce-e1e66f6a8585	─Éß║╖ng Huy T├┤n	lehaianh25022003@gmail.com	$2b$10$/Q8foXwcnn5Qi6E3pxHhj.aqYN7Z8ftt7DiarqCqWpzrQEMBuMvLC	C - 404	t	\N	2025-10-17 10:30:38.508728+07	\N	\N	resident	\N	\N	t	\N
d5f9562e-b42c-4683-8519-5575613cbe9b	Nguyß╗àn ─É─âng Minh	thedevilplayz3@gmail.com	$2b$10$oMwCYU7VMrm.Lozkuw74ne4OahsmxUCriVj2.tqkn7o8p/4v0ZnfO	\N	f	e8777a6377798d29f6b9926366e5dc2daf8646089e6d89b2c6ea0b71a65c4e4c	2025-11-24 21:47:34.958394+07	\N	\N	user	\N	0862748223	t	\N
300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	Admin	admin@quanlychungcu.com	$2b$10$3w3RHHeSDHLY9SUty69A7OACSZwA88UHIQyFNQ3TNKXVQNEFUnoby	\N	t	\N	2025-10-10 13:51:16.68093+07	\N	\N	admin	\N	\N	t	\N
4b04408d-6bd7-4436-91fd-b65716f2f563	─Éinh C├┤ng T├║	kocomailmahoi4@gmail.com	$2b$10$Rx94cBR70NzcPMxKI4BhkODbyztQV6Izr5g9fLKJetKRKridKxMLm	B - 206	t	\N	2025-10-17 10:57:41.592888+07	\N	\N	resident	\N	\N	t	\N
323b184f-b460-48c2-bfda-5bca9943556d	L├¬ Ho├áng Anh	kocomailmahoi2@gmail.com	$2b$10$ZYRKo69aajfFRiT01Zr4ru6k8Q1Zg2C1TObE0TC0qZTHP7pPyZJ52	A - 606	t	\N	2025-10-17 10:55:04.019474+07	\N	\N	resident	\N	\N	t	\N
1f34a886-e578-4062-b6e2-dfde319ef78f	─Éß║╖ng Huyß╗ün Trang	trangdang1805@gmail.com	$2b$10$H9DFL6Kje0u/X6TA/F7In.MCWOuqra3E6rJztDGlH0ZYl2Ft.U902	\N	t	\N	2025-12-15 11:45:15.241023+07	\N	\N	user	\N	0967446908	t	\N
1a9ddec2-aa43-441f-a504-b4a0c8d54e33	─Éß╗ù Thß╗ï Th╞░	dothithu@gmail	$2b$10$/Kr8uFk4thMo3uhXAf2DRe2aTQ56Uqyu2JkGkfyJtCdLS8y0KTxp.	\N	f	75d87b09ff075a10f56d4615e16da28b55b1cd2925e8d939580b0015ea352f05	2025-12-15 11:50:15.737591+07	\N	\N	user	\N	0862748229	t	\N
1fbe7162-51de-4ddb-b583-d806d9e2d40c	Tß║í Xu├ón B├ích	txb1234@gmail.com	$2b$10$tSanp4b7TXXcpKHTSZCkJO6y7mouepQRnpxQmVoP2t.WI4fovDk5C	A - 306	t	\N	2025-10-21 16:50:29.47043+07	\N	\N	resident	\N	0862748229	t	\N
33d3a768-1c01-4385-acc6-b3c2f505ec6d	─Éß║╖ng Thuß╗│ Linh	dangthuylinh@gmail.com	$2b$10$xzxiMCNO9PX2tuwlwQIcKO1Vs07OWu7/rS7ohAtSCXObJnx0QAOXq	A - 1802	t	\N	2025-12-17 10:49:28.999969+07	951acd712ea66d4964c484212048f63b326ad26197af886b37d1d2b5bef165cc	2025-12-17 11:50:00.1+07	resident	\N	0862748123	t	\N
825a94f6-3b05-4d9d-806d-9abefdb6aa9b	V┼⌐ Kh├ính Minh	kocomailmahoi5@gmail.com	$2b$10$6KsX6J970YZfJIniMaX/C.bsoOLZILV2ptEAeSPfw0OsyyILVN8tC	B - 305	t	\N	2025-10-17 11:00:55.459514+07	\N	\N	resident	\N	\N	t	\N
6f4487dc-4660-4ebc-94e3-4b169b3a5686	Tß║í Xu├ón B├ích	txb@gmail.com	$2b$10$hDse0dWaZf8/nJ4XgoZMd.ljSrxjnJShk.DZ1DlkuHRgxyEXc5kQi	B - 205	t	\N	2025-10-14 16:24:02.736553+07	\N	\N	resident	\N	\N	t	\N
df9d80bc-f95b-430c-b3f7-0aec87e9314a	 Hß║úi Anh	haianh10102023@gmail.com	$2b$10$oyhx82JHEJg5BEhZz2z8BOISwej2tR82FvkEcNxmJO/tmOkST3Tk6	C - 2006	t	\N	2025-10-08 17:21:16.202823+07	\N	\N	resident	0862748220	\N	t	\N
9b85ca25-9a4c-4b02-970f-03f9c2508e4c	Xuan Bach	bach2411@gmail.com	$2b$10$sZiV4uZmav6aB9HJPKWG7.iwnS/CapJljcHQD0z0hIhWG7HERT.3.	B - 1804	t	\N	2025-11-25 15:08:36.562746+07	\N	\N	resident	\N	0134453645	t	\N
f4f27bc2-3007-43c1-b9ac-239a12d4d949	Nguyß╗àn Anh V┼⌐	thedevilplayz2@gmail.com	$2b$10$ABcBQhGWI0fzOZteNFlr1.q0nclfRJrM3MigiLvUKiWTYK9ObIL7G	\N	t	\N	2025-11-24 11:31:44.821514+07	\N	\N	resident	\N	0862748222	t	\N
f1484565-6580-4e47-83d5-564b464edcc8	L├¬ Hß║úi Anh	vminhmon3@gmail.com	$2b$10$1GeOOlYRTm.zAzCjyBAD.e.w3IUdkgKAMIVE6gxj1BbrHU4ewOVQG	C - 1902	t	\N	2025-10-08 17:06:37.785088+07	\N	\N	resident	0862748220	\N	t	\N
c7dc3940-a243-41af-9e8a-1fa454af1f87	Nguyß╗àn Quß╗│nh Mai	quynhmai@gmail.com	$2b$10$EbbkB2NTk8gDgMlcFV.bl.GugPAgXcztK6Ln3.1f1KnZJk4AXVPAu	A - 605	t	\N	2025-10-30 16:17:20.647805+07	\N	\N	resident	\N	\N	t	\N
8ac0483d-450e-4c3a-8083-3fb895f7935b	L├¬ Huy Anh	kocomailmahoi@gmail.com	$2b$10$vnTmyiBsjEZlSF445LJjke3ASfYGlbPguxli3DdqWwLAepo/YLLvu	C - 305	t	\N	2025-10-17 10:39:44.302502+07	\N	\N	resident	\N	\N	t	\N
ce04e770-7d67-4082-a462-61d404c6a660	Nguyß╗àn Kh├ính	kocomailmahoi3@gmail.com	$2b$10$zOqIb8KSn.QJI3wzxTrZoOAEw/lzRfufLwb8W7UwJ4SDZPByTxdlq	C - 206	t	\N	2025-10-17 10:56:04.652262+07	\N	\N	resident	\N	\N	t	\N
4a5fcd08-7266-47c1-b1b0-dd1bda27e0b0	Pham Quang Huy	kocomailmahoi9@gmail.com	$2b$10$1u8XheFXt1Q.EqgJ6nhnIemghTc7a1wGDmko.lPFlXTyPg6KO0qBi	B - 1805	t	\N	2025-10-17 11:29:46.12443+07	\N	\N	resident	\N	\N	t	\N
\.


--
-- Data for Name: vehicle_card_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicle_card_requests (id, resident_id, request_type, target_card_id, vehicle_type, full_name, dob, phone, relationship, license_plate, brand, color, proof_image_url, reason, status, requested_at, reviewed_by, reviewed_at, admin_notes, one_time_fee_amount, billed_in_bill_id) FROM stdin;
1	1fbe7162-51de-4ddb-b583-d806d9e2d40c	register	\N	car	L├¬ Hß║úi Anh	2025-09-29	0862748229	q╞░eqwe	29B2-17540	Mercedes-Benz	Xanh	/uploads/proofs/proofImage-1761753221322-478723073.jpg	\N	approved	2025-10-29 22:53:41.323767+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-10-30 10:10:43.286364+07	\N	0.00	\N
3	1fbe7162-51de-4ddb-b583-d806d9e2d40c	reissue	1	car	Tß║í Xu├ón B├ích	\N	\N	\N	29B2-17540	Mercedes-Benz	\N	\N	sss	rejected	2025-10-30 10:45:41.997145+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-10-30 10:46:03.975034+07	ngu	0.00	\N
4	1fbe7162-51de-4ddb-b583-d806d9e2d40c	cancel	1	car	Tß║í Xu├ón B├ích	\N	\N	\N	29B2-17540	Mercedes-Benz	\N	\N	bb	approved	2025-10-30 10:46:32.724846+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-10-30 10:46:45.557196+07	\N	0.00	\N
5	1fbe7162-51de-4ddb-b583-d806d9e2d40c	register	\N	car	─Éß║╖ng Huy T├┤n	2025-10-09	0862748220	├öng	30A-17527	Madza	Xanh	/uploads/proofs/proofImage-1761824216943-453408645.png	\N	approved	2025-10-30 18:36:56.977666+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-10-30 18:38:48.002351+07	\N	0.00	\N
6	1fbe7162-51de-4ddb-b583-d806d9e2d40c	cancel	2	car	Tß║í Xu├ón B├ích	\N	\N	\N	30A-17525	Madza	\N	\N	mß║Ñt	approved	2025-10-30 18:41:19.887386+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-10-30 18:41:37.990324+07	\N	0.00	\N
2	1fbe7162-51de-4ddb-b583-d806d9e2d40c	register	\N	motorbike	 mit	2025-10-30	0862748229	Bß╗æ	29C2-17521	Honda	─Éen	/uploads/proofs/proofImage-1761793921291-745067507.jpg	\N	approved	2025-10-30 10:12:01.297744+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-10-30 18:50:51.923645+07	\N	0.00	\N
7	1fbe7162-51de-4ddb-b583-d806d9e2d40c	reissue	3	motorbike	Tß║í Xu├ón B├ích	\N	\N	\N	29C2-17521	Honda	\N	\N	dssdsd	rejected	2025-10-30 19:00:40.96375+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-10-30 19:01:00.177514+07	ß║Ñ	0.00	\N
8	1fbe7162-51de-4ddb-b583-d806d9e2d40c	register	\N	motorbike	Tß║í Xu├ón B├ích	2025-10-01	0862748227	Bß╗æ	29C2-17521	Honda	─Éen	/uploads/proofs/proofImage-1761826565634-901234174.png	\N	rejected	2025-10-30 19:16:05.651347+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-10-31 08:26:15.927148+07	s	0.00	\N
9	1fbe7162-51de-4ddb-b583-d806d9e2d40c	cancel	3	motorbike	Tß║í Xu├ón B├ích	\N	\N	\N	29C2-17521	Honda	\N	\N	╞░	approved	2025-10-31 08:15:13.456844+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-10-31 08:26:24.296241+07	\N	0.00	\N
10	1fbe7162-51de-4ddb-b583-d806d9e2d40c	register	\N	car	L├¬ Hß║úi Anh	2025-10-09	0862748227	Bß╗æ	29C2-17521	Honda	─Éen	/uploads/proofs/proofImage-1761876232959-305757579.png	\N	approved	2025-10-31 09:03:52.995215+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-10-31 09:08:22.545993+07	\N	0.00	\N
15	1fbe7162-51de-4ddb-b583-d806d9e2d40c	cancel	4	car	Tß║í Xu├ón B├ích	\N	\N	\N	29C2-17521	Honda	\N	\N	sss	rejected	2025-11-10 14:22:40.639804+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-11-10 14:23:27.888486+07	no	0.00	\N
16	1fbe7162-51de-4ddb-b583-d806d9e2d40c	cancel	4	car	Tß║í Xu├ón B├ích	\N	\N	\N	29C2-17521	Honda	\N	\N	s	approved	2025-11-10 14:27:43.047139+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-11-10 14:27:51.981685+07	\N	0.00	\N
14	1fbe7162-51de-4ddb-b583-d806d9e2d40c	register	\N	bicycle	Tß║í Xu├ón B├ích	2025-11-05	0862748220	Ban Than	N/A	q╞░eqeqweqw	Xanh	/uploads/proofs/proofImage-1762758848715-611175355.jpg	\N	approved	2025-11-10 14:14:08.727578+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-11-10 15:42:39.2043+07	\N	0.00	\N
13	1fbe7162-51de-4ddb-b583-d806d9e2d40c	register	\N	bicycle	Bß╗æng	2025-11-19	0862748220	Em 	N/A	Vinfast	─Éß╗Å	/uploads/proofs/proofImage-1762756832997-102246929.jpg	\N	approved	2025-11-10 13:40:33.016594+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-11-10 15:47:21.320938+07	\N	0.00	\N
12	1fbe7162-51de-4ddb-b583-d806d9e2d40c	register	\N	motorbike	Nguyß╗àn Quß╗│nh Mai	2025-11-06	0967446908	Em 	29C2-17524	Vinfast	Xanh	/uploads/proofs/proofImage-1762745457170-184258773.jpg	\N	approved	2025-11-10 10:30:57.174665+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-11-10 15:50:23.11006+07	\N	0.00	\N
17	1fbe7162-51de-4ddb-b583-d806d9e2d40c	register	\N	car	Tß║í Xu├ón B├ích	2025-11-11	0862748229	Em 	29C2-17521	Honda	Xanh	/uploads/proofs/proofImage-1762847681907-147570897.jpg	\N	approved	2025-11-11 14:54:41.914494+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-11-11 14:55:02.910715+07	\N	0.00	\N
18	1fbe7162-51de-4ddb-b583-d806d9e2d40c	cancel	7	motorbike	Tß║í Xu├ón B├ích	\N	\N	\N	29C2-17524	Vinfast	\N	\N	Kh├┤ng c├│ nhu cß║ºu nß╗»a	approved	2025-11-11 16:14:50.04475+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-11-12 13:50:01.650016+07	\N	0.00	\N
19	1fbe7162-51de-4ddb-b583-d806d9e2d40c	register	\N	motorbike	L├¬ Hß║úi Anh	2003-02-25	0862748227	Bß╗æ	29C2-17521	Honda	─Éß╗Å	/uploads/proofs/proofImage-1763049746921-72106920.jpg	\N	pending	2025-11-13 23:02:26.927378+07	\N	\N	\N	0.00	\N
22	9b85ca25-9a4c-4b02-970f-03f9c2508e4c	register	\N	car	Tß║í Xu├ón B├ích	2003-11-21	0967446908	Tenant	29C2-17524	Honda	─Éen	/uploads/proofs/proofImage-1764059063940-914727840.jpeg	\N	rejected	2025-11-25 15:24:23.94335+07	\N	\N	User demoted to regular user	0.00	\N
23	c2f026a4-2766-4487-a5d4-f75c2306546a	cancel	10	car	Anh Hß║úi L├¬	\N	\N	\N	29C2-17521	Vinfast	\N	\N	b├ín	approved	2025-11-26 13:29:01.191284+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-11-26 13:29:19.662743+07	\N	0.00	\N
21	c2f026a4-2766-4487-a5d4-f75c2306546a	register	\N	car	Tß║í Xu├ón B├ích	2025-11-18	0862748225	Em 	29C2-17521	Vinfast	─Éen	/uploads/proofs/proofImage-1763457875857-297231944.jpg	\N	approved	2025-11-18 16:24:35.859127+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-11-18 16:25:15.260687+07	\N	200000.00	24
20	c2f026a4-2766-4487-a5d4-f75c2306546a	register	\N	car	L├¬ Hß║úi Anh	2025-11-18	0862748229	Bß╗æ	29C2-17521	Honda	Xanh	/uploads/proofs/proofImage-1763457831887-665347210.jpg	\N	approved	2025-11-18 16:23:51.919687+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-11-18 17:24:58.428624+07	\N	200000.00	24
11	1fbe7162-51de-4ddb-b583-d806d9e2d40c	register	\N	motorbike	L├¬ Huy Anh	2025-11-10	0862748220	EM	29C2-17524	Honda	V├áng	/uploads/proofs/proofImage-1762745363327-804763726.jpg	\N	approved	2025-11-10 10:29:23.335173+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-11-12 13:50:25.721568+07	\N	100000.00	37
24	c2f026a4-2766-4487-a5d4-f75c2306546a	register	\N	car	L├¬ Hß║úi Anh	2025-12-03	0862748229	Family	29C2-17521	Honda	─Éen	/uploads/proofs/proofImage-1764774457981-425052215.jpeg	\N	approved	2025-12-03 22:07:37.99095+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-12-03 22:07:52.362568+07	\N	200000.00	\N
28	c2f026a4-2766-4487-a5d4-f75c2306546a	cancel	11	car	Anh Hß║úi L├¬	\N	\N	\N	29C2-17521	Honda	\N		ewqe	approved	2025-12-18 16:37:33.981708+07	300c5c8a-99a1-4eea-be9a-90d22ed3cbd3	2025-12-18 16:37:57.01504+07	\N	0.00	\N
\.


--
-- Data for Name: vehicle_cards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicle_cards (id, resident_id, card_user_name, vehicle_type, license_plate, brand, color, card_identifier, status, issued_at, expires_at, created_from_request_id) FROM stdin;
1	1fbe7162-51de-4ddb-b583-d806d9e2d40c	L├¬ Hß║úi Anh	car	29B2-17540	Mercedes-Benz	Xanh	\N	canceled	2025-10-30 10:10:43.286364+07	\N	1
2	1fbe7162-51de-4ddb-b583-d806d9e2d40c	─Éß║╖ng Huy T├┤n	car	30A-17525	Madza	Xanh	\N	canceled	2025-10-30 18:38:48.002351+07	\N	5
3	1fbe7162-51de-4ddb-b583-d806d9e2d40c	 mit	motorbike	29C2-17521	Honda	─Éen	\N	canceled	2025-10-30 18:50:51.923645+07	\N	2
4	1fbe7162-51de-4ddb-b583-d806d9e2d40c	L├¬ Hß║úi Anh	car	29C2-17521	Honda	─Éen	\N	canceled	2025-10-31 09:08:22.545993+07	\N	10
5	1fbe7162-51de-4ddb-b583-d806d9e2d40c	Tß║í Xu├ón B├ích	bicycle	N/A	q╞░eqeqweqw	Xanh	\N	active	2025-11-10 15:42:39.2043+07	\N	14
6	1fbe7162-51de-4ddb-b583-d806d9e2d40c	Bß╗æng	bicycle	N/A	Vinfast	─Éß╗Å	\N	active	2025-11-10 15:47:21.320938+07	\N	13
8	1fbe7162-51de-4ddb-b583-d806d9e2d40c	Tß║í Xu├ón B├ích	car	29C2-17521	Honda	Xanh	\N	active	2025-11-11 14:55:02.910715+07	\N	17
7	1fbe7162-51de-4ddb-b583-d806d9e2d40c	Nguyß╗àn Quß╗│nh Mai	motorbike	29C2-17524	Vinfast	Xanh	\N	canceled	2025-11-10 15:50:23.11006+07	\N	12
9	1fbe7162-51de-4ddb-b583-d806d9e2d40c	L├¬ Huy Anh	motorbike	29C2-17524	Honda	V├áng	\N	active	2025-11-12 13:50:25.721568+07	\N	11
10	c2f026a4-2766-4487-a5d4-f75c2306546a	Tß║í Xu├ón B├ích	car	29C2-17521	Vinfast	─Éen	\N	canceled	2025-11-18 16:25:15.260687+07	\N	21
12	c2f026a4-2766-4487-a5d4-f75c2306546a	L├¬ Hß║úi Anh	car	29C2-17521	Honda	─Éen	\N	active	2025-12-03 22:07:52.362568+07	\N	24
11	c2f026a4-2766-4487-a5d4-f75c2306546a	L├¬ Hß║úi Anh	car	29C2-17521	Honda	Xanh	\N	canceled	2025-11-18 17:24:58.428624+07	\N	20
\.


--
-- Name: bill_items_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bill_items_item_id_seq', 125, true);


--
-- Name: bill_line_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bill_line_items_id_seq', 109, true);


--
-- Name: bills_bill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bills_bill_id_seq', 42, true);


--
-- Name: community_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.community_rooms_id_seq', 3, true);


--
-- Name: fees_fee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fees_fee_id_seq', 21, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 322, true);


--
-- Name: room_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.room_bookings_id_seq', 9, true);


--
-- Name: service_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_rates_id_seq', 8, true);


--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_transaction_id_seq', 7, true);


--
-- Name: vehicle_card_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicle_card_requests_id_seq', 28, true);


--
-- Name: vehicle_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicle_cards_id_seq', 12, true);


--
-- Name: bill_items bill_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT bill_items_pkey PRIMARY KEY (item_id);


--
-- Name: bill_line_items bill_line_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill_line_items
    ADD CONSTRAINT bill_line_items_pkey PRIMARY KEY (id);


--
-- Name: bills bills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_pkey PRIMARY KEY (bill_id);


--
-- Name: blocks blocks_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_name_key UNIQUE (name);


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (id);


--
-- Name: community_rooms community_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_rooms
    ADD CONSTRAINT community_rooms_pkey PRIMARY KEY (id);


--
-- Name: fees fees_fee_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fees
    ADD CONSTRAINT fees_fee_code_key UNIQUE (fee_code);


--
-- Name: fees fees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fees
    ADD CONSTRAINT fees_pkey PRIMARY KEY (fee_id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: room_bookings room_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_bookings
    ADD CONSTRAINT room_bookings_pkey PRIMARY KEY (id);


--
-- Name: room_type_policies room_type_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_type_policies
    ADD CONSTRAINT room_type_policies_pkey PRIMARY KEY (type_code);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: service_rates service_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_rates
    ADD CONSTRAINT service_rates_pkey PRIMARY KEY (id);


--
-- Name: service_rates service_rates_service_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_rates
    ADD CONSTRAINT service_rates_service_name_key UNIQUE (service_name);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicle_card_requests vehicle_card_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_card_requests
    ADD CONSTRAINT vehicle_card_requests_pkey PRIMARY KEY (id);


--
-- Name: vehicle_cards vehicle_cards_card_identifier_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_cards
    ADD CONSTRAINT vehicle_cards_card_identifier_key UNIQUE (card_identifier);


--
-- Name: vehicle_cards vehicle_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_cards
    ADD CONSTRAINT vehicle_cards_pkey PRIMARY KEY (id);


--
-- Name: idx_bill_line_items_bill_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bill_line_items_bill_id ON public.bill_line_items USING btree (bill_id);


--
-- Name: idx_room_number_per_block; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_room_number_per_block ON public.rooms USING btree (room_number, block_id);


--
-- Name: idx_rooms_block_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rooms_block_id ON public.rooms USING btree (block_id);


--
-- Name: idx_vehicle_card_requests_resident_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_card_requests_resident_id ON public.vehicle_card_requests USING btree (resident_id);


--
-- Name: idx_vehicle_card_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_card_requests_status ON public.vehicle_card_requests USING btree (status);


--
-- Name: idx_vehicle_cards_resident_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicle_cards_resident_id ON public.vehicle_cards USING btree (resident_id);


--
-- Name: bill_items bill_items_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT bill_items_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(bill_id) ON DELETE CASCADE;


--
-- Name: bills bills_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id);


--
-- Name: bills bills_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: vehicle_card_requests fk_billed_in_bill_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_card_requests
    ADD CONSTRAINT fk_billed_in_bill_id FOREIGN KEY (billed_in_bill_id) REFERENCES public.bills(bill_id) ON DELETE SET NULL;


--
-- Name: vehicle_cards fk_created_from_request; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_cards
    ADD CONSTRAINT fk_created_from_request FOREIGN KEY (created_from_request_id) REFERENCES public.vehicle_card_requests(id) ON DELETE SET NULL;


--
-- Name: news news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: room_bookings room_bookings_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_bookings
    ADD CONSTRAINT room_bookings_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.community_rooms(id);


--
-- Name: rooms rooms_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.blocks(id);


--
-- Name: rooms rooms_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(bill_id);


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: vehicle_card_requests vehicle_card_requests_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_card_requests
    ADD CONSTRAINT vehicle_card_requests_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: vehicle_card_requests vehicle_card_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_card_requests
    ADD CONSTRAINT vehicle_card_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: vehicle_card_requests vehicle_card_requests_target_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_card_requests
    ADD CONSTRAINT vehicle_card_requests_target_card_id_fkey FOREIGN KEY (target_card_id) REFERENCES public.vehicle_cards(id) ON DELETE SET NULL;


--
-- Name: vehicle_cards vehicle_cards_resident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_cards
    ADD CONSTRAINT vehicle_cards_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict nK9wczHNgQadttpa2jjDScupSK1sQ0GSze0j5SxV34QbmuLVxZJJiydt01g1nVF

