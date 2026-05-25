import { useEffect, useMemo, useState } from 'react';

const DEFAULT_FIELDS = {
  address: true,
  pincode: true,
  city: true,
  state: true,
  country: false,
};

const normalizePincode = (value) => String(value || '').replace(/\D/g, '').slice(0, 6);

const AddressLookupField = ({
  fields = DEFAULT_FIELDS,
  address = '',
  setAddress,
  pincode = '',
  setPincode,
  state = '',
  setState,
  country = '',
  setCountry,
  city = '',
  setCity,
  disabled = false,
  className = '',
}) => {
  const visibleFields = { ...DEFAULT_FIELDS, ...fields };
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [offices, setOffices] = useState([]);
  const [lastFetchedPincode, setLastFetchedPincode] = useState('');

  const selectedOffice = useMemo(
    () => offices.find((office) => office.Name === city) || null,
    [city, offices]
  );

  const fetchPincodeDetails = async () => {
    const nextPincode = normalizePincode(pincode);

    if (nextPincode.length !== 6) {
      setLookupError('Enter a valid 6-digit pincode first.');
      setOffices([]);
      return;
    }

    if (nextPincode === lastFetchedPincode && offices.length > 0) {
      return;
    }

    try {
      setLoading(true);
      setLookupError('');

      const response = await fetch(`https://api.postalpincode.in/pincode/${nextPincode}`);
      const data = await response.json();
      const postOffices = data?.[0]?.PostOffice || [];

      if (!Array.isArray(postOffices) || postOffices.length === 0) {
        setOffices([]);
        setLookupError('No post office found for this pincode.');
        setLastFetchedPincode(nextPincode);
        return;
      }

      setOffices(postOffices);
      setLastFetchedPincode(nextPincode);
    } catch (error) {
      setOffices([]);
      setLookupError('Failed to load city details for this pincode.');
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelection = (value) => {
    if (!value) {
      setCity?.('');
      return;
    }

    const office = offices.find((item) => item.Name === value);
    if (office) {
      setCity?.(office.Name || '');
      setState?.(office.State || '');
      setCountry?.(office.Country || '');
    } else {
      setCity?.(value);
    }
  };

  useEffect(() => {
    if (!selectedOffice) return;
    setState?.(selectedOffice.State || '');
    setCountry?.(selectedOffice.Country || '');
  }, [selectedOffice, setCountry, setState]);

  const onPincodeChange = (value) => {
    const nextValue = normalizePincode(value);
    setPincode?.(nextValue);
    setOffices([]);
    setLookupError('');
    setLastFetchedPincode('');
  };

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${className}`.trim()}>
      {visibleFields.address ? (
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700">Address</label>
          <textarea
            value={address}
            onChange={(event) => setAddress?.(event.target.value)}
            disabled={disabled}
            placeholder="Enter address"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
          />
        </div>
      ) : null}

      {visibleFields.pincode ? (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Pin Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(event) => onPincodeChange(event.target.value)}
              disabled={disabled}
              placeholder="Enter 6-digit pincode"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={fetchPincodeDetails}
              disabled={disabled || loading}
              className="shrink-0 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Fetching...' : 'Fetch'}
            </button>
          </div>
          {loading ? <p className="text-xs text-slate-500">Loading places...</p> : null}
          {lookupError ? <p className="text-xs text-rose-600">{lookupError}</p> : null}
        </div>
      ) : null}

      {visibleFields.city ? (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">City</label>
          <input
            type="text"
            value={city}
            onChange={(event) => setCity?.(event.target.value)}
            disabled={true}
            placeholder="Enter city"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
          />
          {offices.length > 0 ? (
            <select
              value={offices.some((office) => office.Name === city) ? city : ''}
              onChange={(event) => handleCitySelection(event.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
            >
              <option value="">Select city / post office</option>
              {offices.map((office) => (
                <option key={`${office.Name}-${office.Pincode}`} value={office.Name}>
                  {office.Name}
                </option>
              ))}
            </select>
          ) : null}
          {selectedOffice ? (
            <p className="text-xs text-slate-500">{selectedOffice.District}, {selectedOffice.State}, {selectedOffice.Country}</p>
          ) : null}
        </div>
      ) : null}

      {visibleFields.state ? (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">State</label>
          <input
            type="text"
            value={state}
            readOnly
            placeholder="State will auto-fill"
            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-600 outline-none"
          />
        </div>
      ) : null}

      {visibleFields.country ? (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Country</label>
          <input
            type="text"
            value={country}
            readOnly
            placeholder="Country will auto-fill"
            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-600 outline-none"
          />
        </div>
      ) : null}
    </div>
  );
};

export default AddressLookupField;
